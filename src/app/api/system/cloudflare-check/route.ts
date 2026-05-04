import { NextResponse } from "next/server";

import { env } from "@/lib/env";

/**
 * Verifies Workers AI credentials with a minimal non-vision POST (no image payload).
 */
export async function GET() {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = env.CLOUDFLARE_API_TOKEN?.trim();
  if (!accountId || !token) {
    return NextResponse.json(
      { ok: false, error: "CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN missing" },
      { status: 503 },
    );
  }

  const model = env.CLOUDFLARE_AI_MODEL?.trim() || "@cf/meta/llama-3-8b-instruct";
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
  const started = Date.now();
  console.info("[system/cloudflare-check] request", { urlHost: new URL(url).host, model });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "Reply with the single word OK in JSON: {\"ok\":true}" },
          { role: "user", content: "ping" },
        ],
      }),
    });
    const text = await res.text();
    const latencyMs = Date.now() - started;
    console.info("[system/cloudflare-check] response", { status: res.status, latencyMs, bodyChars: text.length });
    if (!res.ok) {
      console.error("[system/cloudflare-check] body", text.slice(0, 800));
      return NextResponse.json(
        { ok: false, status: res.status, error: text.slice(0, 400), latencyMs },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, status: res.status, latencyMs, bodyPreview: text.slice(0, 200) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[system/cloudflare-check] network", message, error);
    return NextResponse.json(
      { ok: false, error: message, latencyMs: Date.now() - started },
      { status: 502 },
    );
  }
}
