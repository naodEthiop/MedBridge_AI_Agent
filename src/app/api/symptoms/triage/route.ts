import { NextResponse } from "next/server";

import { geminiSymptomTriage } from "@/lib/backend/gemini";

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

    const triage = await geminiSymptomTriage({
      message: body.message.trim(),
      bodyPart: body.bodyPart ?? null,
    });
    const linkedSymptoms = body.bodyPart ? (BODY_PART_HINTS[body.bodyPart] ?? []) : [];

    return NextResponse.json({
      ok: true,
      triage,
      bodyPart: body.bodyPart ?? null,
      linkedSymptoms,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Triage failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
