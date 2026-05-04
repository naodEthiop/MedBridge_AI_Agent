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
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 1024,
        response_mime_type: "application/json",
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
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
