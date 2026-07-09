import { NextRequest, NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LEN = 200;
const MAX_SUBJECT_LEN = 200;
const MAX_MESSAGE_LEN = 5000;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, email, subject, message } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof name !== "string" || !name.trim() ||
    typeof email !== "string" || !EMAIL_RE.test(email.trim()) ||
    typeof message !== "string" || !message.trim()
  ) {
    return NextResponse.json({ error: "Please provide a valid name, email, and message." }, { status: 400 });
  }

  const safeSubject = typeof subject === "string" ? subject.trim() : "";

  if (name.length > MAX_NAME_LEN || email.length > MAX_NAME_LEN || message.length > MAX_MESSAGE_LEN || safeSubject.length > MAX_SUBJECT_LEN) {
    return NextResponse.json({ error: "One or more fields are too long." }, { status: 400 });
  }

  // ── Option A: Resend (recommended — free tier, 100 emails/day)
  // 1. npm install resend (or use the raw fetch call below — no SDK required)
  // 2. Get API key from resend.com
  // 3. Add RESEND_API_KEY to .env.local and Vercel env vars
  const resendKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_EMAIL || "mannemkarthik01@gmail.com";

  if (!resendKey) {
    // ── Option B: No key set — log to console (dev fallback)
    // Still return success so the UI works during local development.
    console.log("📬 Contact form submission (no RESEND_API_KEY set):", { name, email, subject: safeSubject, message });
    return NextResponse.json({ ok: true, note: "dev-mode: logged to console only" });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "ChefGPT <onboarding@resend.dev>", // use your verified domain once set up
        to: [toEmail],
        reply_to: email,
        subject: `[Algorithmic Kitchen] ${safeSubject || "New Reservation from " + name}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #0C0805; color: #F0E6CE; padding: 32px; border-radius: 12px;">
            <h2 style="color: #C8913A; font-size: 22px; margin-bottom: 4px;">🍽️ New Table Reservation</h2>
            <p style="color: #72604E; font-size: 13px; margin-bottom: 24px; border-bottom: 1px solid #2a1f0e; padding-bottom: 16px;">The Algorithmic Kitchen — Contact Form</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="color: #72604E; font-size: 12px; padding: 6px 0; text-transform: uppercase; letter-spacing: 0.08em; width: 90px;">Name</td><td style="color: #F0E6CE; font-size: 15px;">${escapeHtml(name)}</td></tr>
              <tr><td style="color: #72604E; font-size: 12px; padding: 6px 0; text-transform: uppercase; letter-spacing: 0.08em;">Email</td><td><a href="mailto:${escapeHtml(email)}" style="color: #C8913A;">${escapeHtml(email)}</a></td></tr>
              <tr><td style="color: #72604E; font-size: 12px; padding: 6px 0; text-transform: uppercase; letter-spacing: 0.08em;">Subject</td><td style="color: #F0E6CE;">${escapeHtml(safeSubject) || "—"}</td></tr>
            </table>
            <div style="margin-top: 24px; padding: 16px 20px; background: rgba(200,145,58,0.08); border-left: 3px solid #C8913A; border-radius: 0 8px 8px 0;">
              <p style="color: #72604E; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Message</p>
              <p style="color: #F0E6CE; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${escapeHtml(message)}</p>
            </div>
            <p style="color: #72604E; font-size: 11px; margin-top: 24px; text-align: center;">Sent via The Algorithmic Kitchen portfolio</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      console.error("Resend error:", res.status, err);
      return NextResponse.json({ error: "Failed to send message. Please try again or email directly." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json({ error: "Failed to send message. Please try again or email directly." }, { status: 502 });
  }
}
