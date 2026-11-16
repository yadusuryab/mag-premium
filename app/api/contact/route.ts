import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const reply = (status: number, body: Record<string, unknown>) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

const text = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return reply(400, { error: "Invalid request" });
  }
  if (typeof raw !== "object" || raw === null) {
    return reply(400, { error: "Invalid request" });
  }
  const body = raw as Record<string, unknown>;

  // Honeypot: pretend success so bots learn nothing
  if (body.website) return reply(200, { ok: true });

  const name = text(body.name, 100).replace(/[\r\n]+/g, " ");
  const email = text(body.email, 254);
  const message = text(body.message, 2000);

  if (!name || !EMAIL_RE.test(email) || message.length < 10) {
    return reply(400, { error: "Invalid fields" });
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!key || !to || !from) return reply(503, { error: "Unavailable" });

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: email,
        subject: `New message from ${name}`,
        text: `${message}\n\nFrom: ${name} <${email}>`,
      }),
    });
    if (!res.ok) return reply(502, { error: "Send failed" });
    return reply(200, { ok: true });
  } catch {
    return reply(502, { error: "Send failed" });
  }
}