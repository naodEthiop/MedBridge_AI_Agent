import { NextResponse } from "next/server";

import { buildFinalAgentResponse, buildInitialAgentResponse } from "@/lib/backend/agent";
import { getEmergencySteps, getNearbyHospitals } from "@/lib/backend/mcp";
import { processUserInput } from "@/lib/ai/agent";

export async function POST(request: Request) {
  const body = (await request.json()) as { symptom?: string; followUpAnswer?: string };
  const symptom = body.symptom?.trim();
  const followUpAnswer = body.followUpAnswer?.trim();

  if (!symptom) {
    return NextResponse.json({ ok: false, error: "A symptom or question is required." }, { status: 400 });
  }

  if (!followUpAnswer) {
    return NextResponse.json({ ok: true, data: buildInitialAgentResponse(symptom) });
  }

  const medix = await processUserInput({
    message: `${symptom}. ${followUpAnswer}`,
    skipTriage: true,
  });

  const summary = medix.urgency === "urgent" ? `⚠️ URGENT: ${medix.message}` : medix.message;
  const recommendation = medix.nextSteps.join(" ");
  const question =
    medix.urgency === "urgent"
      ? "This appears urgent. Seek immediate medical care right away."
      : medix.nextSteps.length
      ? `Possible next step: ${medix.nextSteps[0]}`
      : "Anything else you want clinical support with?";

  const response = { ok: true, summary, recommendation, question, medix, data: { summary, recommendation, question, medix } };
  if (medix.urgency === "urgent") {
    const [emergencySteps, nearbyHospitals] = await Promise.all([getEmergencySteps(symptom), getNearbyHospitals()]);
    return NextResponse.json({ ...response, emergencySteps, nearbyHospitals });
  }

  return NextResponse.json(response);
}

