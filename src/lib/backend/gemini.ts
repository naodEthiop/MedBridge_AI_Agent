import { z } from "zod";

import { env } from "@/lib/env";

export type GeminiRole = "user" | "model";

const triageSchema = z.object({
  possibleConditions: z.array(z.string()).default([]),
  urgency: z.enum(["low", "medium", "urgent"]),
  nextSteps: z.array(z.string()).min(1),
  redFlags: z.array(z.string()).default([]),
  message: z.string(),
});

export type GeminiTriage = z.infer<typeof triageSchema>;

function requireGeminiKey() {
  if (!env.GEMINI_API_KEY) throw new Error("Gemini is not configured. Set GEMINI_API_KEY.");
  return env.GEMINI_API_KEY;
}

function modelName() {
  return env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
}

async function geminiGenerateJSON(args: { system: string; user: string }) {
  const key = requireGeminiKey();
  const model = modelName();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `${args.system}\n\n${args.user}` }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 800,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const json = (await res.json()) as any;
  const text =
    json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join("") ?? "";
  if (!text) throw new Error("Gemini returned empty response.");
  const parsed = JSON.parse(text);
  return parsed;
}

export async function geminiSymptomTriage(args: {
  message: string;
  bodyPart?: string | null;
}) {
  const system = [
    "You are a clinical triage assistant for a healthcare app.",
    "Return ONLY valid JSON (no markdown).",
    "Do not claim diagnosis; keep it cautious.",
    "If urgent red flags exist, urgency must be 'urgent'.",
    "JSON schema:",
    `{ "possibleConditions": string[], "urgency": "low"|"medium"|"urgent", "nextSteps": string[], "redFlags": string[], "message": string }`,
  ].join("\n");

  const user = `User symptom message: ${args.message}\nSelected body region: ${args.bodyPart ?? "unspecified"}`;
  const raw = await geminiGenerateJSON({ system, user });
  return triageSchema.parse(raw) satisfies GeminiTriage;
}

const imageSchema = z.object({
  medicationName: z.string().nullable().default(null),
  usage: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
  summary: z.string().default(""),
});

export type GeminiImageAnalysis = z.infer<typeof imageSchema>;

/** Shown when the model detects non–health-related input (must match product copy). */
export const MEDIX_NON_HEALTH_REPLY =
  "I'm Medix, your health assistant. I can only help with medical or health-related concerns.";

const medixHealthSchema = z.object({
  message: z.string(),
  urgency: z.enum(["low", "medium", "urgent"]),
  possibleConditions: z.array(z.string()).default([]),
  nextSteps: z.array(z.string()).min(1),
  redFlags: z.array(z.string()).default([]),
});

export type MedixHealthResponse = z.infer<typeof medixHealthSchema>;

/**
 * Medix AI — unified health response (text + optional structured context).
 * Uses the same Gemini stack as triage; enforces health-only scope in the system prompt.
 */
export async function geminiMedixHealthResponse(combinedUserContext: string) {
  const system = [
    "You are Medix, an intelligent medical AI assistant integrated into the MedBridge platform.",
    "You are not a generic chatbot — you behave like a clinical decision-support agent that dynamically adapts based on user input (text, voice, body selection, and image analysis).",
    "",
    "CORE BEHAVIOR",
    "You assist users in understanding symptoms, assessing urgency, and guiding next steps — but you NEVER provide a definitive diagnosis.",
    "You operate using structured reasoning:",
    "1. Understand input (message, selected body part, symptoms, transcript, image findings)",
    "2. Ask targeted follow-up questions",
    "3. Infer possible conditions (ranked, not absolute)",
    "4. Assess urgency (low, medium, urgent)",
    "5. Provide safe next steps",
    "6. Highlight red flags immediately",
    "",
    "BODY REGION LOGIC",
    "If a bodyPart is provided:",
    "- Acknowledge naturally (e.g., \"Let’s focus on your chest area.\")",
    "- Ask 2–3 highly relevant follow-up questions",
    "Region-specific focus:",
    "Head → headache type, vision issues, dizziness, fever",
    "Neck → stiffness, swelling, swallowing, movement",
    "Chest → breathing, pain type, heart rate, radiation to arm/jaw",
    "Abdomen → exact location, digestion, nausea, meals",
    "Back → posture, nerve pain, injury, duration",
    "Arms/Legs → numbness, swelling, weakness, joints",
    "Pelvis → urinary, reproductive, bowel changes",
    "",
    "IMAGE ANALYSIS LOGIC",
    "If imageFindings are present:",
    "- Integrate them into reasoning (DO NOT treat as confirmed diagnosis)",
    "- Use phrases like: \"Based on the image, this could be...\" or \"This might suggest...\"",
    "- Combine with symptoms before conclusions",
    "",
    "QUESTIONING STRATEGY",
    "- Ask only 2–3 focused questions at a time",
    "- Avoid overwhelming the user",
    "- Prioritize narrowing down urgency",
    "",
    "SAFETY RULES (CRITICAL)",
    "- NEVER give a definitive diagnosis",
    "- NEVER prescribe medication",
    "- ALWAYS include uncertainty language: (\"could be\", \"might indicate\", \"possible\")",
    "",
    "RED FLAG DETECTION",
    "Immediately escalate urgency if:",
    "- Chest pain + left arm / jaw → possible cardiac emergency",
    "- Severe headache + vision loss → neurological emergency",
    "- Difficulty breathing → urgent",
    "- Uncontrolled bleeding → emergency",
    "- High fever + stiffness → possible infection",
    "If detected:",
    "- Set urgency = \"urgent\"",
    "- Clearly tell user to seek immediate care",
    "",
    "TONE & STYLE",
    "- Calm, clinical, reassuring",
    "- Not robotic",
    "- Not overly casual",
    "- Feels like a real medical assistant agent",
    "",
    "NON-HEALTH QUESTIONS",
    "If the user asks something unrelated to health:",
    `Respond with this exact phrase: "${MEDIX_NON_HEALTH_REPLY}"`,
    "In that case set urgency to low, possibleConditions to [], nextSteps to [\"Ask a health-related question when you're ready.\"], redFlags to [].",
    "",
    "FINAL LINE (MANDATORY)",
    "Always end your message with: \"This is not a medical diagnosis. Please consult a licensed doctor.\"",
    "",
    "SYSTEM IDENTITY",
    "Name: Medix",
    "Role: AI Health Agent for MedBridge",
    "Behavior: Adaptive, context-aware, medically safe, not a static chatbot",
    "",
    "Return ONLY valid JSON (no markdown).",
    "JSON schema:",
    `{ "message": string, "urgency": "low"|"medium"|"urgent", "possibleConditions": string[], "nextSteps": string[], "redFlags": string[] }`,
  ].join("\n");

  const user = `Context from the user (may include symptoms text and/or summarized image findings — all non-diagnostic until reviewed by a clinician):\n${combinedUserContext}`;
  const raw = await geminiGenerateJSON({ system, user });
  return medixHealthSchema.parse(raw) satisfies MedixHealthResponse;
}

const riskPredictionSchema = z.object({
  risk_score: z.number().min(0).max(100),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']),
  predicted_conditions: z.array(z.string()).default([]),
  recommended_actions: z.array(z.string()).default([]),
  escalation_required: z.boolean(),
  rationale: z.string(),
});
export type RiskPrediction = z.infer<typeof riskPredictionSchema>;

export async function geminiRiskPrediction(args: {
  demographics: string;
  symptomsHistory: string;
  timelineSummary: string;
  labsSummary: string;
}) {
  const system = [
    'You are a clinical risk prediction engine for a healthcare platform.',
    'Return ONLY valid JSON (no markdown).',
    'Use the input to assess current risk and decide whether escalation is required.',
    'JSON schema:',
    `{ "risk_score": number, "risk_level": "low"|"medium"|"high"|"critical", "predicted_conditions": string[], "recommended_actions": string[], "escalation_required": boolean, "rationale": string }`,
  ].join('\n');

  const user = [
    `Demographics: ${args.demographics}`,
    `Symptoms history: ${args.symptomsHistory}`,
    `Timeline summary: ${args.timelineSummary}`,
    `Lab summary: ${args.labsSummary}`,
  ].join('\n\n');

  const raw = await geminiGenerateJSON({ system, user });
  return riskPredictionSchema.parse(raw) satisfies RiskPrediction;
}

const doctorCopilotSchema = z.object({
  patientSummary: z.string(),
  abnormalities: z.array(z.string()).default([]),
  differentialDiagnoses: z.array(z.string()).default([]),
  treatmentRecommendations: z.array(z.string()).default([]),
  doctorNotes: z.string(),
  takeaway: z.string(),
});
export type DoctorCopilotReport = z.infer<typeof doctorCopilotSchema>;

export async function geminiDoctorCopilotReport(args: {
  patientProfile: string;
  timelineSummary: string;
  labsSummary: string;
  appointmentsSummary: string;
}) {
  const system = [
    'You are a clinical doctor copilot for a healthcare provider.',
    'Return ONLY valid JSON (no markdown).',
    'Summarize patient history, highlight abnormalities, propose differential diagnoses, suggest treatment paths, and auto-generate doctor notes.',
    'JSON schema:',
    `{ "patientSummary": string, "abnormalities": string[], "differentialDiagnoses": string[], "treatmentRecommendations": string[], "doctorNotes": string, "takeaway": string }`,
  ].join('\n');

  const user = [
    `Patient profile: ${args.patientProfile}`,
    `Timeline summary: ${args.timelineSummary}`,
    `Lab summary: ${args.labsSummary}`,
    `Appointments summary: ${args.appointmentsSummary}`,
  ].join('\n\n');

  const raw = await geminiGenerateJSON({ system, user });
  return doctorCopilotSchema.parse(raw) satisfies DoctorCopilotReport;
}

export async function geminiAnalyzeImage(args: {
  kind: "prescription" | "derm" | "medication";
  mimeType: string;
  base64Data: string;
  hintText?: string;
}) {
  const key = requireGeminiKey();
  const model = modelName();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const prompt = [
    "You are a medical assistant analyzing an uploaded image for a healthcare app.",
    "Return ONLY valid JSON (no markdown).",
    "If you cannot identify a medication confidently, set medicationName to null.",
    "JSON schema:",
    `{ "medicationName": string|null, "usage": string[], "warnings": string[], "confidence": number, "summary": string }`,
    args.hintText ? `Hint: ${args.hintText}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: args.mimeType, data: args.base64Data } },
          ],
        },
      ],
      generationConfig: { temperature: 0.2, maxOutputTokens: 900, responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const json = (await res.json()) as any;
  const text =
    json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join("") ?? "";
  if (!text) throw new Error("Gemini returned empty response.");
  const parsed = JSON.parse(text);
  return imageSchema.parse(parsed) satisfies GeminiImageAnalysis;
}

