import { NextRequest, NextResponse } from "next/server";

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_TOKENS = 1000;
const MAX_MESSAGES = 40;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const UNAVAILABLE = { error: "The AI assistant is temporarily unavailable. Please try again shortly." };

type IncomingMessage = { role: "user" | "assistant"; content: string };

function isValidMessage(m: unknown): m is IncomingMessage {
  return (
    typeof m === "object" &&
    m !== null &&
    ((m as IncomingMessage).role === "user" || (m as IncomingMessage).role === "assistant") &&
    typeof (m as IncomingMessage).content === "string" &&
    (m as IncomingMessage).content.trim().length > 0
  );
}

export async function POST(req: NextRequest) {
  // Server-only secret — never sent to the client, never logged.
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set — /api/chat is disabled until it is configured.");
    return NextResponse.json(
      { error: "Chat is not configured yet. Please contact the site owner or try again later." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { system, messages } = (body ?? {}) as { system?: unknown; messages?: unknown };

  if (
    typeof system !== "string" ||
    system.length > 4000 ||
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > MAX_MESSAGES ||
    !messages.every(isValidMessage)
  ) {
    return NextResponse.json({ error: "Invalid chat request." }, { status: 400 });
  }

  // Model is decided server-side only — the client cannot override it.
  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Log full detail server-side only; never forward provider errors straight to the browser.
      console.error("OpenAI API error:", response.status, data);
      return NextResponse.json(UNAVAILABLE, { status: 502 });
    }

    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      console.error("OpenAI API returned no reply content:", data);
      return NextResponse.json(UNAVAILABLE, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat API request failed:", err);
    return NextResponse.json(UNAVAILABLE, { status: 502 });
  }
}
