import { NextResponse } from "next/server";
import { runSymptomTriage } from "@/lib/ai/aiService";

/**
 * Operational check: one real OpenAI round-trip (no silent fallback).
 * Requires OPENAI_API_KEY on the server.
 */
export async function GET() {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return NextResponse.json({ ok: false, error: "OPENAI_API_KEY not set" }, { status: 503 });
  }
  const started = Date.now();
  try {
    const result = await runSymptomTriage({
      message: "Connectivity check: mild headache for 2 hours, no fever.",
      bodyPart: "head",
    });

    if ('error' in result) {
      throw new Error(String(result.error));
    }

    return NextResponse.json({
      ok: true,
      latencyMs: Date.now() - started,
      sample: { riskLevel: result.riskLevel, messagePreview: result.message.slice(0, 120) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "OpenAI check failed";
    console.error("[system/openai-check]", message, error);
    return NextResponse.json(
      { ok: false, error: message, latencyMs: Date.now() - started },
      { status: 502 },
    );
  }
}
