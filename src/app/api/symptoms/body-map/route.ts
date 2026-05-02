import { NextResponse } from "next/server";

const BODY_PART_HINTS: Record<string, string[]> = {
  head: ["headache", "dizziness", "vision changes"],
  chest: ["chest pain", "shortness of breath", "palpitations"],
  stomach: ["abdominal pain", "nausea", "vomiting"],
  back: ["back pain", "muscle stiffness", "radiating pain"],
  arms: ["arm weakness", "numbness", "joint pain"],
  legs: ["leg pain", "swelling", "cramps"],
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const bodyPart = url.searchParams.get("bodyPart");
  if (!bodyPart) {
    return NextResponse.json({ ok: true, bodyParts: BODY_PART_HINTS });
  }
  return NextResponse.json({
    ok: true,
    bodyPart,
    symptoms: BODY_PART_HINTS[bodyPart] ?? [],
  });
}
