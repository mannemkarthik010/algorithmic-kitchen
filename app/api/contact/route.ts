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
        from: "Portfolio contact <onboarding@resend.dev>", // use your verified domain once set up
        to: [toEmail],
        reply_to: email,
        subject: `[Portfolio] ${safeSubject || "New message from " + name}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #101317; color: #F2EFE8; padding: 32px; border-radius: 12px;">
            <h2 style="color: #D87B55; font-size: 22px; margin-bottom: 4px;">New message</h2>
            <p style="color: #6D7882; font-size: 13px; margin-bottom: 24px; border-bottom: 1px solid #2a1f0e; padding-bottom: 16px;">karthikmannem.com — contact form</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="color: #6D7882; font-size: 12px; padding: 6px 0; text-transform: uppercase; letter-spacing: 0.08em; width: 90px;">Name</td><td style="color: #F2EFE8; font-size: 15px;">${escapeHtml(name)}</td></tr>
              <tr><td style="color: #6D7882; font-size: 12px; padding: 6px 0; text-transform: uppercase; letter-spacing: 0.08em;">Email</td><td><a href="mailto:${escapeHtml(email)}" style="color: #D87B55;">${escapeHtml(email)}</a></td></tr>
              <tr><td style="color: #6D7882; font-size: 12px; padding: 6px 0; text-transform: uppercase; letter-spacing: 0.08em;">Subject</td><td style="color: #F2EFE8;">${escapeHtml(safeSubject) || "—"}</td></tr>
            </table>
            <div style="margin-top: 24px; padding: 16px 20px; background: rgba(216,123,85,0.08); border-left: 3px solid #D87B55; border-radius: 0 8px 8px 0;">
              <p style="color: #6D7882; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Message</p>
              <p style="color: #F2EFE8; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${escapeHtml(message)}</p>
            </div>
            <p style="color: #6D7882; font-size: 11px; margin-top: 24px; text-align: center;">Sent via karthikmannem.com</p>
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
