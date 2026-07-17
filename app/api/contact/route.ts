import { NextResponse } from "next/server";

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

interface ContactPayload {
  from_name: string;
  project_type: string;
  business_description: string;
  timeline?: string;
  reply_to: string;
}

function isValidPayload(body: unknown): body is ContactPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.from_name === "string" &&
    b.from_name.trim().length > 0 &&
    typeof b.project_type === "string" &&
    b.project_type.trim().length > 0 &&
    typeof b.business_description === "string" &&
    b.business_description.trim().length > 0 &&
    typeof b.reply_to === "string" &&
    b.reply_to.trim().length > 0 &&
    (b.timeline === undefined || typeof b.timeline === "string")
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!isValidPayload(body)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
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
        from_name: body.from_name,
        project_type: body.project_type,
        business_description: body.business_description,
        timeline: body.timeline ?? "",
        reply_to: body.reply_to,
      },
    }),
  });

  if (!emailjsResponse.ok) {
    return NextResponse.json({ error: "failed to send" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
