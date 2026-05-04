import {
  geminiMedixHealthResponse,
  geminiSymptomTriage,
  type MedixHealthResponse,
} from "@/lib/backend/gemini";
import { env } from "@/lib/env";

export type HealthAgentInput = {
  message?: string;
  symptoms?: string[];
  /** Short findings from vision pipeline (e.g. Cloudflare); not a diagnosis. */
  imageFindings?: string[];
  /** Body region from body map — forwarded to `/api/symptoms/triage`-equivalent logic. */
  bodyPart?: string | null;
  /** Optional speech transcript (e.g. Whisper). */
  transcript?: string;
};

export type HealthAgentOutput = MedixHealthResponse;

export function isHealthQuery(input: string) {
  return /(pain|fever|symptom|health|doctor|medicine|injury|disease|body)/i.test(input);
}

function buildHealthQueryContext(input: ProcessUserInputArgs): string {
  const lines: string[] = [];
  if (input.bodyPart) {
    lines.push(`Selected body region: ${input.bodyPart}.`);
  }
  if (input.transcript?.trim()) {
    lines.push(`Voice transcript: ${input.transcript.trim()}`);
  }
  if (input.message?.trim()) {
    lines.push(input.message.trim());
  }
  if (input.symptoms?.length) {
    lines.push(`Symptoms list: ${input.symptoms.join("; ")}`);
  }
  return lines.join("\n\n").trim();
}

/**
 * Combines free text, symptom tags, and image-derived findings into one Medix AI response.
 * Uses Gemini via `geminiMedixHealthResponse` (server-side only). Fails loudly on model errors.
 */
export async function generateHealthResponse(input: HealthAgentInput): Promise<HealthAgentOutput> {
  const chunks: string[] = [];

  if (input.message?.trim()) {
    const message = input.message.trim();
    if (!isHealthQuery(message)) {
      return {
        message: "I'm Medix, your health assistant. I can only help with medical or health-related concerns.",
        urgency: "low",
        possibleConditions: [],
        nextSteps: ["Ask a health-related question when you're ready."],
        redFlags: [],
      };
    }
    chunks.push(message);
  }
  if (input.symptoms?.length) {
    chunks.push(`Reported symptoms: ${input.symptoms.join("; ")}`);
  }
  if (input.imageFindings?.length) {
    chunks.push(`Image review notes (non-diagnostic): ${input.imageFindings.join("; ")}`);
  }

  if (!chunks.length) {
    return {
      message:
        "I'm Medix. Share what you're feeling in your own words, or upload a relevant image, and I'll walk through possibilities and next steps.",
      urgency: "low",
      possibleConditions: [],
      nextSteps: ["Describe your symptoms or add a photo if it helps illustrate the concern."],
      redFlags: [],
    };
  }

  if (!env.GEMINI_API_KEY?.trim()) {
    throw new Error("GEMINI_API_KEY is not configured; Medix cannot call Gemini.");
  }

  return geminiMedixHealthResponse(chunks.join("\n\n"));
}

export type ProcessUserInputArgs = HealthAgentInput & {
  /** When true, skip internal triage call (caller already ran `/api/symptoms/triage`). */
  skipTriage?: boolean;
};

/**
 * Unified pipeline: optional structured triage + Medix response. No silent AI fallback.
 */
export async function processUserInput(input: ProcessUserInputArgs): Promise<MedixHealthResponse> {
  const combinedMessage = buildHealthQueryContext(input);
  const mergedFindings = [...(input.imageFindings ?? [])];

  if (combinedMessage && !isHealthQuery(combinedMessage) && !input.bodyPart && !input.imageFindings?.length) {
    return {
      message: "I'm Medix, your health assistant. I can only help with medical or health-related concerns.",
      urgency: "low",
      possibleConditions: [],
      nextSteps: [],
      redFlags: [],
    };
  }

  if (!input.skipTriage && combinedMessage && env.GEMINI_API_KEY?.trim()) {
    const t = await geminiSymptomTriage({
      message: combinedMessage,
      bodyPart: input.bodyPart ?? null,
    });
    mergedFindings.push(
      `Triage summary: ${t.message}`,
      `Triage urgency: ${t.urgency}`,
      `Triage considerations: ${t.possibleConditions.join(", ") || "none noted"}`,
      ...(t.redFlags.length ? [`Triage red flags: ${t.redFlags.join("; ")}`] : []),
    );
  }

  return await generateHealthResponse({
    message: combinedMessage || undefined,
    symptoms: undefined,
    imageFindings: mergedFindings.length ? mergedFindings : undefined,
  });
}
