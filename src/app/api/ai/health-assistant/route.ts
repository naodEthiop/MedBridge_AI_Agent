import { NextResponse } from "next/server";

import { runHealthAssistant } from "@/lib/ai/aiService";
import { createCase } from "@/lib/backend/case-service";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getRepositories } from "@/lib/server/repositories";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!env.GEMINI_API_KEY?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Medix AI text engine is not configured (GEMINI_API_KEY)." },
        { status: 503 },
      );
    }

    const body = (await req.json()) as HealthAgentInput & { skipTriage?: boolean; transcript?: string };
    const medix = await runHealthAssistant({
      message: typeof body.message === "string" ? body.message : undefined,
      symptoms: Array.isArray(body.symptoms) ? body.symptoms.filter((s): s is string => typeof s === "string") : undefined,
      imageFindings: Array.isArray(body.imageFindings)
        ? body.imageFindings.filter((s): s is string => typeof s === "string")
        : undefined,
      bodyPart: typeof body.bodyPart === "string" ? body.bodyPart : body.bodyPart === null ? null : undefined,
      transcript: typeof body.transcript === "string" ? body.transcript : undefined,
      skipTriage: body.skipTriage === true,
    });

    const repos = getRepositories();
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
