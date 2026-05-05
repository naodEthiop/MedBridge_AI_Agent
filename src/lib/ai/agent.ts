import { safeGenerateAI } from "@/lib/ai/openaiClient";

export type MedixHealthResponse = {
  message: string;
  urgency: "low" | "medium" | "urgent";
  possibleConditions: string[];
  nextSteps: string[];
  redFlags: string[];
};

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
  return /(pain|fever|symptom|health|doctor|medicine|injury|disease|body|hello|hi|who are you)/i.test(input);
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
 * Uses OpenAI (server-side only). Fails loudly on model errors.
 */
export async function generateHealthResponse(input: HealthAgentInput): Promise<HealthAgentOutput> {
  const chunks: string[] = [];

  if (input.message?.trim()) {
    const message = input.message.trim();
    if (!isHealthQuery(message)) {
      return {
        message: "I am the MedBridge Online Doctor Assistant. I can assist you with clinical questions, symptom evaluations, and health-related guidance. How can I help you today?",
        urgency: "low",
        possibleConditions: [],
        nextSteps: ["Please describe your medical concern or symptoms."],
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
        "Hello! I am the MedBridge Online Doctor Assistant. Please share your symptoms or concerns, and I will provide professional guidance on potential causes and recommended next steps.",
      urgency: "low",
      possibleConditions: [],
      nextSteps: ["Provide details on your current condition."],
      redFlags: [],
    };
  }

  const prompt = `You are the MedBridge Online Doctor Assistant. Respond to: "${chunks.join("\n\n")}".
  
  Persona & Behavior:
  - Professional Physician: Speak with authority, expertise, and deep empathy.
  - Guided Care: Focus on explaining symptoms and providing clinical pathways.
  - Safe & Responsible: Never issue a definitive diagnosis. Use professional, non-diagnostic language.
  - Human Tone: Avoid robotic language; maintain a warm, physician-like conversational style.

  Return JSON only: { "message": string, "urgency": "low"|"medium"|"urgent", "possibleConditions": string[], "nextSteps": string[], "redFlags": string[] }`;

  try {
    const raw = await safeGenerateAI(prompt, "You are the MedBridge Online Doctor Assistant, a professional and empathetic clinician.", true);
    return JSON.parse(raw);
  } catch (e) {
    console.error("OpenAI health response failed", e);
    return {
      message: "MedBridge Online Doctor services are temporarily unavailable. If this is an emergency, please contact local emergency services immediately.",
      urgency: "low",
      possibleConditions: [],
      nextSteps: [],
      redFlags: [],
    };
  }
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
      message: "I am the MedBridge Online Doctor Assistant. I focus on providing clinical guidance for medical and health-related concerns.",
      urgency: "low",
      possibleConditions: [],
      nextSteps: [],
      redFlags: [],
    };
  }

  if (!input.skipTriage && combinedMessage) {
    try {
      const triagePrompt = `You are the MedBridge Online Doctor Assistant acting in a triage capacity. Analyze: "${combinedMessage}" ${input.bodyPart ? `region: ${input.bodyPart}` : ""}.
      
      Instructions:
      - Assess urgency professionally.
      - Highlight clinical considerations.
      - Maintain a professional, guiding tone.

      Return JSON only: { "message": string, "urgency": "low"|"medium"|"urgent", "redFlags": string[], "possibleConditions": string[], "nextSteps": string[] }`;
      
      const rawTriage = await safeGenerateAI(triagePrompt, "You are the MedBridge Online Doctor Assistant, conducting a professional triage.", true);
      const t = JSON.parse(rawTriage);
      
      mergedFindings.push(
        `Clinical Evaluation: ${t.message}`,
        `Urgency Assessment: ${t.urgency}`,
        `Differential Considerations: ${t.possibleConditions.join(", ") || "none immediately noted"}`,
        ...(t.redFlags.length ? [`Clinical Warning Signs: ${t.redFlags.join("; ")}`] : []),
      );
    } catch (e) {
      console.error("Triage step failed in agent", e);
    }
  }

  return await generateHealthResponse({
    message: combinedMessage || undefined,
    symptoms: undefined,
    imageFindings: mergedFindings.length ? mergedFindings : undefined,
  });
}
