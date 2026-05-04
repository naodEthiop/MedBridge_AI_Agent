import { NextResponse } from "next/server";

import { buildInitialAgentResponse } from "@/lib/backend/agent";
import { getEmergencySteps, getNearbyHospitals } from "@/lib/backend/mcp";
import { runHealthAssistant } from "@/lib/ai/aiService";
import { emitEvent } from "@/lib/server/events";
import { getAuthenticatedUser, UnauthorizedError } from "@/lib/server/auth";
import { repositoryPrincipalFromAuthenticatedUser } from "@/lib/server/repositories";

export async function POST(request: Request) {
  let user;
  try {
    user = await getAuthenticatedUser(request);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }
    throw error;
  }

  const body = (await request.json()) as {
    symptom?: string;
    followUpAnswer?: string;
    clientMessageId?: string;
    threadId?: string;
  };
  const symptom = body.symptom?.trim();
  const followUpAnswer = body.followUpAnswer?.trim();

  if (!symptom) {
    return NextResponse.json({ ok: false, error: "A symptom or question is required." }, { status: 400 });
  }

  if (!followUpAnswer) {
    return NextResponse.json({ ok: true, data: buildInitialAgentResponse(symptom) });
  }

  const medix = await runHealthAssistant({
    message: `${symptom}. ${followUpAnswer}`,
    repoPrincipal: repositoryPrincipalFromAuthenticatedUser(user),
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

  const assistantContent = [summary, recommendation, question].filter(Boolean).join("\n\n");
  const threadId = typeof body.threadId === "string" && body.threadId.trim() ? body.threadId.trim() : "doctor-assistant";
  const clientMessageId = typeof body.clientMessageId === "string" ? body.clientMessageId : undefined;
  emitEvent("chat:message_created", {
    threadId,
    clientMessageId,
    role: "assistant",
    content: assistantContent,
    timestamp: new Date().toISOString(),
  });

  if (medix.urgency === "urgent") {
    const [emergencySteps, nearbyHospitals] = await Promise.all([getEmergencySteps(symptom), getNearbyHospitals()]);
    return NextResponse.json({ ...response, emergencySteps, nearbyHospitals });
  }

  return NextResponse.json(response);
}

