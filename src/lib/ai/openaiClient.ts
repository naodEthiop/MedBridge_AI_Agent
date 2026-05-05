import OpenAI from "openai";

let _openai: OpenAI | null = null;

export function getOpenAI() {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set.");
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

let lastRequestTime = 0;

export async function generateAIResponse(message: string, systemPrompt?: string, jsonMode = false) {
  const client = getOpenAI();
  const res = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: systemPrompt || "You are the MedBridge Online Doctor Assistant, a professional and empathetic clinician. Be conversational, simple, and supportive. Focus on providing clinical guidance without issuing definitive medical diagnoses.",
      },
      { role: "user", content: message },
    ],
    response_format: jsonMode ? { type: "json_object" } : undefined,
    temperature: 0.7,
    max_tokens: 1024,
  });

  return res.choices[0].message.content || "";
}

export async function safeGenerateAI(message: string, systemPrompt?: string, jsonMode = false) {
  const now = Date.now();

  // Simple 2-second rate limiting for demo stability
  if (now - lastRequestTime < 2000) {
    throw new Error("RATE_LIMIT_HIT");
  }

  lastRequestTime = now;

  try {
    return await generateAIResponse(message, systemPrompt, jsonMode);
  } catch (e) {
    console.error("OpenAI Error:", e);
    throw e;
  }
}
