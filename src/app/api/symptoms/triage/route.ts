import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { generateGeminiResponse } from "@/lib/ai/geminiClient";

const BODY_PART_HINTS: Record<string, string[]> = {
  head: ["headache", "dizziness", "vision changes"],
  chest: ["chest pain", "shortness of breath", "palpitations"],
  stomach: ["abdominal pain", "nausea", "vomiting"],
  back: ["back pain", "muscle stiffness", "radiating pain"],
  arms: ["arm weakness", "numbness", "joint pain"],
  legs: ["leg pain", "swelling", "cramps"],
};

const fallback = {
  diagnosis: "AI failed",
  riskLevel: "unknown",
  confidence: 0,
  recommendations: ["Retry"]
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { message?: string; bodyPart?: string | null; patientProfile?: string };
    if (!body.message || !body.message.trim()) {
      return NextResponse.json({ message: fallback }, { status: 200 });
    }

    if (!env.GEMINI_API_KEY?.trim()) {
      return NextResponse.json({ message: fallback }, { status: 200 });
    }

    const prompt = `You are a medical AI. Analyze symptoms and return JSON:
{
  "diagnosis": "string",
  "riskLevel": "low" | "medium" | "high",
  "confidence": number,
  "recommendations": ["string"]
}

Patient Message: "${body.message.trim()}"
${body.bodyPart ? `Body Part: ${body.bodyPart}` : ""}
${body.patientProfile ? `Patient Profile: ${body.patientProfile}` : ""}`;

    try {
      const responseText = await generateGeminiResponse(prompt);
      console.log("Gemini raw response:", responseText);
      const cleaned = responseText.replace(/```json/i, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;
      if (
        !parsed ||
        typeof parsed !== "object" ||
        typeof parsed.diagnosis !== "string" ||
        typeof parsed.riskLevel !== "string" ||
        !Array.isArray(parsed.recommendations)
      ) {
        throw new Error(`Gemini triage returned invalid payload: ${JSON.stringify(parsed)}`);
      }

      return NextResponse.json({
        message: parsed,
        bodyPart: body.bodyPart ?? null,
        linkedSymptoms: body.bodyPart ? (BODY_PART_HINTS[body.bodyPart] ?? []) : [],
      });
    } catch (aiError) {
      console.error("Gemini AI or parse error:", aiError);
      return NextResponse.json({
        message: fallback,
        bodyPart: body.bodyPart ?? null,
        linkedSymptoms: body.bodyPart ? (BODY_PART_HINTS[body.bodyPart] ?? []) : [],
      });
    }
  } catch (error) {
    console.error("Triage API error:", error);
    return NextResponse.json({ message: fallback }, { status: 200 });
  }
}
