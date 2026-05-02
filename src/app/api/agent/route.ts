import { NextResponse } from "next/server";

import { buildFinalAgentResponse, buildInitialAgentResponse } from "@/lib/backend/agent";
import { getEmergencySteps, getNearbyHospitals } from "@/lib/backend/mcp";

export async function POST(request: Request) {
  const body = (await request.json()) as { symptom?: string; followUpAnswer?: string };
  const symptom = body.symptom?.trim();
  const followUpAnswer = body.followUpAnswer?.trim();

  if (!symptom) return NextResponse.json({ error: "A symptom or question is required." }, { status: 400 });
  if (!followUpAnswer) return NextResponse.json(buildInitialAgentResponse(symptom));

  const result = buildFinalAgentResponse(symptom, followUpAnswer);
  if (result.risk === "high") {
    const [emergencySteps, nearbyHospitals] = await Promise.all([getEmergencySteps(symptom), getNearbyHospitals()]);
    return NextResponse.json({ ...result, emergencySteps, nearbyHospitals });
  }
  return NextResponse.json(result);
}

