import { NextResponse } from "next/server";
import { runSymptomTriage } from "@/lib/ai/aiService";

const BODY_PART_HINTS: Record<string, string[]> = {
  head: ["headache", "dizziness", "vision changes"],
  chest: ["chest pain", "shortness of breath", "palpitations"],
  stomach: ["abdominal pain", "nausea", "vomiting"],
  back: ["back pain", "muscle stiffness", "radiating pain"],
  arms: ["arm weakness", "numbness", "joint pain"],
  legs: ["leg pain", "swelling", "cramps"],
};

const fallback = {
  diagnosis: "AI unavailable",
  riskLevel: "low" as const,
  confidence: 0,
  recommendations: ["Please consult a healthcare professional for proper evaluation"],
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { message?: string; bodyPart?: string | null };
    if (!body.message || !body.message.trim()) {
      return NextResponse.json(fallback, { status: 200 });
    }

    const timeoutPromise = new Promise<typeof fallback>((resolve) => {
      setTimeout(() => resolve(fallback), 12000);
    });

    const triagePromise = runSymptomTriage({
      message: body.message.trim(),
      bodyPart: body.bodyPart ?? null,
    });

    const result = await Promise.race([triagePromise, timeoutPromise]);
    const triage = "diagnosis" in result ? result : fallback;

    return NextResponse.json({
      ...triage,
      bodyPart: body.bodyPart ?? null,
      linkedSymptoms: body.bodyPart ? (BODY_PART_HINTS[body.bodyPart] ?? []) : [],
    });
  } catch (error) {
    console.error("Triage API error:", error);
    return NextResponse.json(fallback, { status: 200 });
  }
}
