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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { 
      message?: string; 
      bodyPart?: string | null;
      history?: { role: "user" | "ai"; text: string }[];
    };
    if (!body.message || !body.message.trim()) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const triage = await runSymptomTriage({
      message: body.message,
      bodyPart: body.bodyPart ?? null,
      history: body.history ?? [],
    });

    return NextResponse.json({
      message: triage,
      bodyPart: body.bodyPart ?? null,
      linkedSymptoms: body.bodyPart ? (BODY_PART_HINTS[body.bodyPart] ?? []) : [],
    });
  } catch (error) {
    console.error("Triage API error:", error);
    return NextResponse.json({ 
      message: {
        message: "I'm having trouble analyzing that. Can you describe it differently?",
        followUpQuestions: [],
        riskLevel: "low",
        recommendations: []
      }
    }, { status: 200 });
  }
}
