import { NextResponse } from "next/server";
import { runSymptomTriage } from "@/lib/ai/aiService";
import { safeFetch } from "@/lib/env";

const BODY_PART_HINTS: Record<string, string[]> = {
  head: ["headache", "dizziness", "vision changes"],
  chest: ["chest pain", "shortness of breath", "palpitations"],
  stomach: ["abdominal pain", "nausea", "vomiting"],
  back: ["back pain", "muscle stiffness", "radiating pain"],
  arms: ["arm weakness", "numbness", "joint pain"],
  legs: ["leg pain", "swelling", "cramps"],
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { message?: string; bodyPart?: string | null };
    if (!body.message || !body.message.trim()) {
      return NextResponse.json({ ok: false, error: "message is required" }, { status: 400 });
    }

    // Add timeout wrapper for AI triage
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Triage timeout')), 15000); // 15 second timeout
    });

    const triagePromise = runSymptomTriage({
      message: body.message.trim(),
      bodyPart: body.bodyPart ?? null,
    });

    const triage = await Promise.race([triagePromise, timeoutPromise]);

    if (triage && typeof triage === 'object' && 'error' in triage) {
      return NextResponse.json({
        ok: false,
        error: (triage as { error: string }).error,
        diagnosis: "Unable to analyze symptoms",
        riskLevel: "unknown",
        confidence: 0,
        recommendations: ["Please consult a healthcare professional for proper evaluation"]
      }, { status: 503 });
    }

    const linkedSymptoms = body.bodyPart ? (BODY_PART_HINTS[body.bodyPart] ?? []) : [];

    return NextResponse.json({
      ok: true,
      triage,
      bodyPart: body.bodyPart ?? null,
      linkedSymptoms,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Triage failed";
    console.error('Triage API error:', error);
    return NextResponse.json({
      ok: false,
      error: message,
      diagnosis: "Unable to analyze symptoms",
      riskLevel: "unknown",
      confidence: 0,
      recommendations: ["Please consult a healthcare professional for proper evaluation"]
    }, { status: 500 });
  }
}
