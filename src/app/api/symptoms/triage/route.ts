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
  const fallback = {
    diagnosis: "Unable to analyze symptoms",
    riskLevel: "medium" as const,
    confidence: 0,
    recommendations: ["Please consult a healthcare professional for a proper evaluation."],
  };
  try {
    const body = (await req.json()) as { message?: string; bodyPart?: string | null };
    if (!body.message || !body.message.trim()) {
<<<<<<< Updated upstream
      return NextResponse.json(fallback, { status: 200 });
    }

    const timeoutPromise = new Promise<typeof fallback>((resolve) => {
      setTimeout(() => resolve(fallback), 12000);
=======
      return NextResponse.json({ ...fallback, diagnosis: "Message is required", riskLevel: "low" }, { status: 400 });
    }

    const timeoutPromise = new Promise<{ error: string }>((resolve) => {
      setTimeout(() => resolve({ error: "Triage timeout" }), 12000);
>>>>>>> Stashed changes
    });

    const triagePromise = runSymptomTriage({
      message: body.message.trim(),
      bodyPart: body.bodyPart ?? null,
    });

<<<<<<< Updated upstream
    const result = await Promise.race([triagePromise, timeoutPromise]);
    const triage = "diagnosis" in result ? result : fallback;

    return NextResponse.json({
      ...triage,
      bodyPart: body.bodyPart ?? null,
      linkedSymptoms: body.bodyPart ? (BODY_PART_HINTS[body.bodyPart] ?? []) : [],
=======
    const triage = await Promise.race([triagePromise, timeoutPromise]);

    if ("error" in triage) {
      return NextResponse.json(fallback, { status: 200 });
    }

    const riskLevel = triage.urgency === "urgent" ? "high" : triage.urgency === "medium" ? "medium" : "low";
    const diagnosis = triage.message || "Possible non-specific condition";
    const recommendations = triage.nextSteps?.length
      ? triage.nextSteps
      : body.bodyPart
        ? (BODY_PART_HINTS[body.bodyPart] ?? fallback.recommendations)
        : fallback.recommendations;

    return NextResponse.json({
      diagnosis,
      riskLevel,
      confidence: 0.75,
      recommendations,
>>>>>>> Stashed changes
    });
  } catch (error) {
    console.error("Triage API error:", error);
    return NextResponse.json(fallback, { status: 200 });
  }
}
