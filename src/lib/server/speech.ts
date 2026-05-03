import { env } from "@/lib/env";

/**
 * OpenAI Whisper-compatible transcription. Requires OPENAI_API_KEY.
 */
export async function transcribeAudioBlob(audio: Blob, filename = "audio.webm"): Promise<{ text: string } | { error: string }> {
  const key = env.OPENAI_API_KEY?.trim();
  if (!key) {
    return { error: "Speech-to-text is not configured (OPENAI_API_KEY)." };
  }

  try {
    const form = new FormData();
    form.append("file", audio, filename);
    form.append("model", env.OPENAI_TRANSCRIPTION_MODEL?.trim() || "whisper-1");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });

    if (!res.ok) {
      const errText = await res.text();
      return { error: errText.slice(0, 200) || `Transcription failed (${res.status})` };
    }

    const json = (await res.json()) as { text?: string };
    const text = json.text?.trim() ?? "";
    if (!text) {
      return { error: "No speech detected." };
    }
    return { text };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Transcription failed.";
    return { error: message };
  }
}
