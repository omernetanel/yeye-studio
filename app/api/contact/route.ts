import { NextResponse } from "next/server";

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

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
  project_type: 80,
  business_description: 2000,
  timeline: 200,
  reply_to: 254,
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
 * smuggled into a message — a Bcc, a different Reply-To — and the template
 * fields below are put into headers by the mail service, not by us. Folding
 * them to a single line removes the vector wherever they end up.
 */
function oneLine(value: string) {
  return value.replace(/[\r\n\t]+/g, " ").trim();
}

interface ContactPayload {
  from_name: string;
  project_type: string;
  business_description: string;
  timeline: string;
  reply_to: string;
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

  const from_name = text(b.from_name, LIMITS.from_name);
  const project_type = text(b.project_type, LIMITS.project_type);
  const reply_to = text(b.reply_to, LIMITS.reply_to);
  if (!from_name || !project_type || !reply_to || !EMAIL.test(reply_to)) return null;

  // The body of the message, where line breaks are content rather than a
  // header risk — so it keeps them, and is only capped.
  if (typeof b.business_description !== "string") return null;
  const business_description = b.business_description.trim();
  if (business_description.length === 0 || business_description.length > LIMITS.business_description) return null;

  const timeline = b.timeline === undefined ? "" : text(b.timeline, LIMITS.timeline);
  if (timeline === null) return null;

  return { from_name, project_type, business_description, timeline, reply_to };
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

  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    return NextResponse.json({ error: "email service not configured" }, { status: 500 });
  }

  const emailjsResponse = await fetch(EMAILJS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey,
      template_params: {
        from_name: payload.from_name,
        project_type: payload.project_type,
        business_description: payload.business_description,
        timeline: payload.timeline,
        reply_to: payload.reply_to,
      },
    }),
  });

  if (!emailjsResponse.ok) {
    return NextResponse.json({ error: "failed to send" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
