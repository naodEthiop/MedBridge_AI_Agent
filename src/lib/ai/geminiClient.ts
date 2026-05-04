import { env } from "@/lib/env";

export async function generateGeminiResponse(prompt: string) {
  const apiKey = env.GEMINI_API_KEY?.trim();
  console.log("Gemini Key Loaded:", !!process.env.GEMINI_API_KEY);
  console.log("Gemini prompt:", prompt);

  if (!apiKey) {
    const fallback = JSON.stringify({ error: "Gemini API key missing", message: "Gemini API key is not configured." });
    console.log("Gemini raw response:", fallback);
    return fallback;
  }

  const model = "gemini-2.5-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        response_mime_type: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.log("Gemini raw response:", text);
    throw new Error(`Gemini API failed with status ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  console.log("Gemini raw response:", text);

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}
