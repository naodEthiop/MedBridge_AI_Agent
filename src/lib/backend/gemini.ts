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

