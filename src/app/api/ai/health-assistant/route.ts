import { NextResponse } from "next/server";

import { runHealthAssistant } from "@/lib/ai/aiService";
import type { HealthAgentInput } from "@/lib/ai/agent";
import { createCase } from "@/lib/backend/case-service";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { emitEvent } from "@/lib/server/events";
import { getRepositories, repositoryPrincipalFromAuthenticatedUser } from "@/lib/server/repositories";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  try {
    // AI HEALTH ANALYSIS FLOW (primary implementation):
    // API route -> aiService.runHealthAssistant -> repositories.timeline.createTimelineEvent
    // -> emitEvent("ai:analysis_completed") -> response.
    // Timeline write must happen before event emission.
    const user = await getAuthenticatedUser(req);
    if (!env.GEMINI_API_KEY) {
      return NextResponse.json({
        result: "AI unavailable",
        fallback: true,
      });
    }

    const body = (await req.json()) as HealthAgentInput & { patientId?: string; transcript?: string };
    const principal = repositoryPrincipalFromAuthenticatedUser(user);
    const medix = await runHealthAssistant({
      message: typeof body.message === "string" ? body.message : undefined,
      symptoms: Array.isArray(body.symptoms) ? body.symptoms.filter((s): s is string => typeof s === "string") : undefined,
      imageFindings: Array.isArray(body.imageFindings)
        ? body.imageFindings.filter((s): s is string => typeof s === "string")
        : undefined,
      bodyPart: typeof body.bodyPart === "string" ? body.bodyPart : body.bodyPart === null ? null : undefined,
      transcript: typeof body.transcript === "string" ? body.transcript : undefined,
      patientId: body.patientId ?? user.id,
      repoPrincipal: principal,
    });

    const repos = getRepositories(principal);
    const patientId = user.role === 'patient' ? user.id : body.patientId ?? user.id;
    if (patientId) {
      try {
        await repos.timeline.createTimelineEvent({
          patientId,
          eventType: 'ai:analysis_completed',
          title: 'Medix AI assessment completed',
          description: medix.message,
          severity: medix.urgency === 'urgent' ? 'critical' : medix.urgency === 'medium' ? 'medium' : 'low',
          source: 'ai',
          metadata: {
            nextSteps: medix.nextSteps,
            possibleConditions: medix.possibleConditions,
            redFlags: medix.redFlags,
          },
        });
        emitEvent('ai:analysis_completed', {
          patientId,
          urgency: medix.urgency,
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to persist Medix timeline event', error);
      }
    }

    let persistedCase: { id: string; createdAt: string; persisted?: boolean } | null = null;
    const token = req.headers.get('authorization')?.startsWith('Bearer ') ? req.headers.get('authorization')!.slice(7) : null;
    if (token) {
      try {
        const symptoms =
          typeof body.message === 'string' && body.message.trim()
            ? body.message.trim()
            : Array.isArray(body.symptoms)
            ? body.symptoms.filter((s): s is string => typeof s === 'string').join('; ')
            : 'Health concern';
        persistedCase = await createCase(
          {
            symptoms,
            urgency: medix.urgency === 'urgent' ? 'urgent' : 'medium',
            redFlags: medix.redFlags,
            doctorSummary: medix.message,
          },
          token,
        );
      } catch {
        persistedCase = null;
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        medix,
        recommendedActions: medix.nextSteps,
        case: persistedCase,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Medix AI failed to respond.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
