import type { PrescriptionAnalysis } from "@/lib/backend/types";
import { env } from "@/lib/env";

/**
 * Prescription assist via Cloudflare AI Gateway when explicitly enabled.
 * When CLOUDFLARE_AI_ENABLED is true, missing credentials or runtime failure throws — no silent null.
 */
export async function analyzePrescriptionWithCloudflare(file: File): Promise<PrescriptionAnalysis> {
  const enabled = env.CLOUDFLARE_AI_ENABLED?.trim().toLowerCase() === "true";
  if (!enabled) {
    throw new Error("CLOUDFLARE_AI_ENABLED is not true; prescription Cloudflare path is off.");
  }
  if (!env.CLOUDFLARE_AI_GATEWAY_BASE_URL?.trim()) {
    throw new Error("CLOUDFLARE_AI_GATEWAY_BASE_URL is required when Cloudflare AI is enabled.");
  }
  if (!env.CLOUDFLARE_AI_GATEWAY_TOKEN?.trim()) {
    throw new Error("CLOUDFLARE_AI_GATEWAY_TOKEN is required when Cloudflare AI is enabled.");
  }

  const started = Date.now();
  const url = env.CLOUDFLARE_AI_GATEWAY_BASE_URL!.trim();
  console.info("[Cloudflare AI] prescription assist request", {
    file: file.name,
    bytes: file.size,
    urlHost: new URL(url).host,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_AI_GATEWAY_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.CLOUDFLARE_AI_MODEL ?? "@cf/meta/llama-3-8b-instruct",
      messages: [
        {
          role: "system",
          content:
            "You classify whether an upload looks like a prescription image. Reply JSON only: {detected:boolean,confidence:'high'|'possible'|'low',medicine?:string,dosage?:string,timing?:string,summary:string}",
        },
        { role: "user", content: `Filename: ${file.name}` },
      ],
    }),
  });

  const latencyMs = Date.now() - started;
  const text = await res.text();
  console.info("[Cloudflare AI] prescription assist response", { status: res.status, latencyMs, bodyChars: text.length });
  if (!res.ok) {
    console.error("[Cloudflare AI] failure body (truncated)", text.slice(0, 1200));
    throw new Error(`Cloudflare AI gateway failed (${res.status}): ${text.slice(0, 400)}`);
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("Cloudflare AI gateway returned non-JSON.");
  }

  const detected = Boolean(parsed.detected);
  const confidence =
    parsed.confidence === "high" || parsed.confidence === "possible" || parsed.confidence === "likely"
      ? (parsed.confidence as PrescriptionAnalysis["confidence"])
      : "possible";

  return {
    detected,
    confidence,
    medicine: typeof parsed.medicine === "string" ? parsed.medicine : undefined,
    dosage: typeof parsed.dosage === "string" ? parsed.dosage : undefined,
    timing: typeof parsed.timing === "string" ? parsed.timing : undefined,
    summary: typeof parsed.summary === "string" ? parsed.summary : "Cloudflare AI response received.",
  };
}
