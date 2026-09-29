import { NextResponse } from "next/server";
import { FORMS_INBOX, FORMS_SENDER } from "@/lib/site";

// Resend's REST endpoint, called straight from the server: the key never
// reaches the browser, and no SDK is needed for one POST.
const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * THE FORM'S ONLY REAL GATE. The browser's own checks are a courtesy to the
 * reader — a POST straight at this route skips every one of them — so anything
 * that matters is enforced here: what the fields may contain, how long they may
 * be, how big the request may be, and how often one address may send.
 */

// Three short fields and a sentence. Eight kilobytes is far more than the form
// can produce and small enough that a junk payload is rejected before it is
// parsed at all.
const MAX_BODY_BYTES = 8 * 1024;

// Per field, in characters. reply_to's 254 is the maximum length of an email
// address; the rest are generous versions of what the form can send.
const LIMITS = {
  from_name: 120,
  phone: 40,
  message: 2000,
  reply_to: 254,
} as const;

// Which form on the site a message came from, as the forms name it and as the
// inbox reads it. A fixed list rather than free text: the label is printed in
// the message, and nothing a stranger types should be able to set it.
const SOURCES = {
  contact: "הטופס שעל הסרטון, באמצע העמוד",
  cta: "הטופס בסוף העמוד",
} as const;

// Deliberately loose: the point is to reject what is obviously not an address,
// not to out-argue the RFC. Anything stricter starts refusing real addresses.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Five in ten minutes from one address. A person filling the form twice is
// fine; a script in a loop is not. Held in this instance's memory, so it is a
// speed bump rather than a wall — serverless spreads requests over instances —
// and it costs nothing to keep.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const recentByIp = new Map<string, number[]>();

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (recentByIp.get(ip) ?? []).filter((at) => now - at < RATE_WINDOW_MS);
  // Swept here rather than on a timer: the map only ever grows while requests
  // are arriving, and every arrival cleans its own key.
  if (recent.length >= RATE_MAX) {
    recentByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  recentByIp.set(ip, recent);
  if (recentByIp.size > 5000) {
    for (const [key, times] of recentByIp) {
      if (times.every((at) => now - at >= RATE_WINDOW_MS)) recentByIp.delete(key);
    }
  }
  return false;
}

/**
 * Everything that reaches a mail header has to be one line.
 *
 * A name or an address carrying a carriage return is how a second header is
 * smuggled into a message — a Bcc, a different Reply-To — and the name goes
 * into the subject and the address into Reply-To, both headers. Folding them
 * to a single line removes the vector wherever they end up.
 */
function oneLine(value: string) {
  return value.replace(/[\r\n\t]+/g, " ").trim();
}

interface ContactPayload {
  from_name: string;
  reply_to: string;
  phone: string;
  message: string;
  source: (typeof SOURCES)[keyof typeof SOURCES];
}

function readPayload(body: unknown): ContactPayload | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  // The trap. The form renders a field no one can see and browsers do not fill;
  // anything in it came from something filling every input on the page.
  if (typeof b.website === "string" && b.website.trim().length > 0) return null;

  const text = (value: unknown, max: number) => {
    if (typeof value !== "string") return null;
    const clean = oneLine(value);
    if (clean.length === 0 || clean.length > max) return null;
    return clean;
  };

  // Name and address are required; the form cannot be answered without them.
  const from_name = text(b.from_name, LIMITS.from_name);
  const reply_to = text(b.reply_to, LIMITS.reply_to);
  if (!from_name || !reply_to || !EMAIL.test(reply_to)) return null;

  if (typeof b.source !== "string" || !Object.hasOwn(SOURCES, b.source)) return null;
  const source = SOURCES[b.source as keyof typeof SOURCES];

  // Optional: absent or empty is fine, anything else must be a string that
  // fits. The phone is one line like the name; the message keeps its line
  // breaks, which are content in a body rather than a header risk.
  const optional = (value: unknown, max: number, singleLine: boolean) => {
    if (value === undefined || value === "") return "";
    if (typeof value !== "string") return null;
    const clean = singleLine ? oneLine(value) : value.trim();
    return clean.length > max ? null : clean;
  };
  const phone = optional(b.phone, LIMITS.phone, true);
  const message = optional(b.message, LIMITS.message, false);
  if (phone === null || message === null) return null;

  return { from_name, reply_to, phone, message, source };
}

export async function POST(request: Request) {
  // Read as text first: JSON.parse on an unbounded body is the one thing that
  // happens before any check could run, so the size is checked before that.
  const raw = await request.text().catch(() => null);
  if (raw === null || raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const payload = readPayload(parsed);
  if (!payload) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  // Counted only once the message is worth sending, so a flood of junk cannot
  // spend a real visitor's allowance.
  if (rateLimited(clientIp(request))) {
    return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // The name only, never a value: this lands in the host's logs, and a form
    // that fails for every visitor should say why there.
    console.error("contact: email service not configured, missing RESEND_API_KEY");
    return NextResponse.json({ error: "email service not configured" }, { status: 500 });
  }

  // Plain text, not HTML: everything in it came from a stranger, and text has
  // nothing in it a mail client could render or run. Hebrew labels, because it
  // is read in Hebrew.
  // The phone on a line of its own, second, because it is how these are
  // answered; "לא נמסר" rather than a missing line, so its absence is read.
  const lines = [
    `שם: ${payload.from_name}`,
    `טלפון: ${payload.phone || "לא נמסר"}`,
    `דוא״ל: ${payload.reply_to}`,
    `הגיעה מ: ${payload.source}`,
    ...(payload.message ? ["", "מה יש להם בראש:", payload.message] : []),
  ];

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FORMS_SENDER,
      to: [FORMS_INBOX],
      // "Reply" in the inbox answers the person who wrote, not the form.
      reply_to: payload.reply_to,
      subject: `פנייה חדשה מהאתר: ${payload.from_name}`,
      text: lines.join("\n"),
    }),
  });

  if (!response.ok) {
    // Resend answers a refusal with a short JSON reason (an unverified domain,
    // a bad key, a rate limit). It carries no secrets, and it is the only way
    // to tell one cause from another in the logs.
    const reason = await response.text().catch(() => "");
    console.error(`contact: Resend refused (${response.status}): ${reason.slice(0, 300)}`);
    return NextResponse.json({ error: "failed to send" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
