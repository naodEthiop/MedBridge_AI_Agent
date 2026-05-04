import { env } from "@/lib/env";
import { geminiSymptomTriage } from "@/lib/backend/gemini";

export type MedicalResponseShape = {
  possibleConditions: string[];
  urgency: "low" | "medium" | "urgent";
  nextSteps: string[];
  redFlags: string[];
  message: string;
};

/**
 * Thin wrapper around symptom triage for callers that expect `{ ... } | { error }`.
 * Does not replace `src/lib/backend/gemini.ts` — reuses it.
 */
export async function generateMedicalResponse(input: {
  message: string;
  bodyPart?: string | null;
}): Promise<MedicalResponseShape | any> {
  if (!env.GEMINI_API_KEY) {
    return {
      result: "AI unavailable",
      fallback: true,
    };
  }

  try {
    const msg = input.message?.trim();
    if (!msg) {
      return { error: "AI unavailable" };
    }
    const t = await geminiSymptomTriage({
      message: msg,
      bodyPart: input.bodyPart ?? null,
    });
    return {
      possibleConditions: t.possibleConditions,
      urgency: t.urgency,
      nextSteps: t.nextSteps,
      redFlags: t.redFlags,
      message: t.message,
    };
  } catch (e) {
    return { error: "Service unavailable", fallback: true };
  }
}
