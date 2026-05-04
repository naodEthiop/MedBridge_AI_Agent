import { NextResponse } from "next/server";

import { geminiSymptomTriage } from "@/lib/backend/gemini";
import { env } from "@/lib/env";

/**
 * Operational check: one real Gemini round-trip (no silent fallback).
 * Requires GEMINI_API_KEY on the server.
 */
export async function GET() {
  if (!env.GEMINI_API_KEY?.trim()) {
    return NextResponse.json({ ok: false, error: "GEMINI_API_KEY not set" }, { status: 503 });
  }
  const started = Date.now();
  try {
    const result = await geminiSymptomTriage({
      message: "Connectivity check: mild headache for 2 hours, no fever.",
      bodyPart: "head",
    });
    return NextResponse.json({
      ok: true,
      latencyMs: Date.now() - started,
      sample: { urgency: result.urgency, messagePreview: result.message.slice(0, 120) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini check failed";
    console.error("[system/gemini-check]", message, error);
    return NextResponse.json(
      { ok: false, error: message, latencyMs: Date.now() - started },
      { status: 502 },
    );
  }
}
