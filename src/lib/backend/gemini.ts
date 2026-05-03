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
  "I'm Medix AI, a health assistant. I can only help with medical or health-related concerns.";

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
    "You are Medix AI, an intelligent medical assistant.",
    "You help users understand symptoms, conditions, and medical concerns.",
    "Rules:",
    "- Only answer health-related questions.",
    `- If the user's question is clearly not about health, medicine, symptoms, wellness, fitness-as-health, mental health, medications, or clinical images, respond with this exact message and nothing else in the message field: "${MEDIX_NON_HEALTH_REPLY}"`,
    "- In that refusal case set urgency to low, possibleConditions to [], nextSteps to [\"Ask a health-related question when you're ready.\"], redFlags to [].",
    "- Never provide definitive diagnosis; use possible causes only.",
    "- Never give illegal advice or unsafe treatments.",
    "- If serious symptoms or red flags: urgency must be urgent and next steps must include seeking immediate in-person care.",
    "- If uncertain, say so clearly in message.",
    "- Tone: calm, professional, human — like a skilled clinical assistant, not a chatbot. Avoid phrases like 'As an AI model'.",
    "Return ONLY valid JSON (no markdown).",
    "JSON schema:",
    `{ "message": string, "urgency": "low"|"medium"|"urgent", "possibleConditions": string[], "nextSteps": string[], "redFlags": string[] }`,
  ].join("\n");

  const user = `Context from the user (may include symptoms text and/or summarized image findings — all non-diagnostic until reviewed by a clinician):\n${combinedUserContext}`;
  const raw = await geminiGenerateJSON({ system, user });
  return medixHealthSchema.parse(raw) satisfies MedixHealthResponse;
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

