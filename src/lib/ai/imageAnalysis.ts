import { env } from "@/lib/env";

const DEFAULT_VISION_MODEL = "@cf/meta/llama-3.2-11b-vision-instruct";

export type MedicalImageSuccess = {
  success: true;
  findings: string[];
  possibleConditions: string[];
  confidence: number;
  urgency: "low" | "medium" | "urgent";
  recommendation: string;
};

export type MedicalImageFailure = { success: false; error: string };

export type MedicalImageResult = MedicalImageSuccess | MedicalImageFailure;

function cloudflareConfigured() {
  return Boolean(env.CLOUDFLARE_ACCOUNT_ID?.trim() && env.CLOUDFLARE_API_TOKEN?.trim());
}

/**
 * Medical image assist via Cloudflare Workers AI (vision model).
 * Configure CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN; optional CLOUDFLARE_AI_MODEL.
 * First-time use of @cf/meta/llama-3.2-11b-vision-instruct may require a one-time `{ "prompt": "agree" }` call per Cloudflare docs.
 */
export async function analyzeMedicalImage(file: File | Blob): Promise<MedicalImageResult> {
  const disabled = env.CLOUDFLARE_AI_ENABLED?.trim().toLowerCase();
  if (disabled === "0" || disabled === "false") {
    return { success: false, error: "Cloudflare medical image analysis is disabled (CLOUDFLARE_AI_ENABLED)." };
  }

  if (!cloudflareConfigured()) {
    return {
      success: false,
      error:
        "Cloudflare Workers AI is not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (Workers AI token).",
    };
  }

  const mimeType = file.type || "image/jpeg";
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const accountId = env.CLOUDFLARE_ACCOUNT_ID!.trim();
  const token = env.CLOUDFLARE_API_TOKEN!.trim();
  const defaultModel = env.CLOUDFLARE_AI_MODEL?.trim() || DEFAULT_VISION_MODEL;
  const models = [defaultModel];
  if (!env.CLOUDFLARE_AI_MODEL?.trim() && defaultModel === DEFAULT_VISION_MODEL) {
    models.push("@cf/meta/llama-3.2-8b-instruct");
  }

  const jsonInstruction = `Return ONLY valid JSON (no markdown) with this shape:
{"findings": string[], "possibleConditions": string[], "confidence": number, "urgency": "low"|"medium"|"urgent", "recommendation": string}
Rules: You are assisting Medix AI. Describe only what can be reasonably observed. Never state a definitive diagnosis. If the image is not medical or not interpretable, set findings to explain that, urgency low, and recommend in-person evaluation if appropriate.`;

  let lastError = "";
  for (const model of models) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
    const reqStarted = Date.now();
    console.info("[Cloudflare AI] vision request", { accountId, model, mimeType, bytes: base64.length });
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You support clinical education and triage. Output JSON only.",
          },
          { role: "user", content: jsonInstruction },
        ],
        image: dataUrl,
      }),
    });

    console.info("[Cloudflare AI] vision response", {
      model,
      status: res.status,
      latencyMs: Date.now() - reqStarted,
    });

    const payload = (await res.json()) as {
      success?: boolean;
      errors?: Array<{ message?: string; code?: number }>;
      messages?: string[];
      result?: { response?: string };
    };

    if (!res.ok || payload.success === false) {
      const hint = payload.errors?.map((e) => e.message).filter(Boolean).join("; ");
      lastError = hint || payload.messages?.[0] || `Cloudflare Workers AI request failed (${res.status}).`;
      if (model !== "@cf/meta/llama-3.2-8b-instruct") {
        continue;
      }
      return {
        success: false,
        error: lastError,
      };
    }

    const text = payload.result?.response?.trim();
    if (!text) {
      lastError = "Empty response from vision model.";
      if (model !== "@cf/meta/llama-3.2-8b-instruct") continue;
      return { success: false, error: lastError };
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        lastError = "Could not parse vision model output as JSON.";
        if (model !== "@cf/meta/llama-3.2-8b-instruct") continue;
        return { success: false, error: lastError };
      }
      try {
        parsed = JSON.parse(match[0]) as Record<string, unknown>;
      } catch {
        lastError = "Could not parse vision model output as JSON.";
        if (model !== "@cf/meta/llama-3.2-8b-instruct") continue;
        return { success: false, error: lastError };
      }
    }

    const findings = Array.isArray(parsed.findings)
      ? parsed.findings.filter((x): x is string => typeof x === "string")
      : [];
    const possibleConditions = Array.isArray(parsed.possibleConditions)
      ? parsed.possibleConditions.filter((x): x is string => typeof x === "string")
      : [];
    const confidence =
      typeof parsed.confidence === "number" && Number.isFinite(parsed.confidence)
        ? Math.min(1, Math.max(0, parsed.confidence))
        : 0.5;
    const urgencyRaw = String(parsed.urgency ?? "medium").toLowerCase();
    const urgency: "low" | "medium" | "urgent" =
      urgencyRaw === "low" ? "low" : urgencyRaw === "urgent" ? "urgent" : "medium";
    const recommendation = typeof parsed.recommendation === "string" ? parsed.recommendation : "";

    return {
      success: true,
      findings,
      possibleConditions,
      confidence,
      urgency,
      recommendation,
    };
  }

  return { success: false, error: lastError || "Cloudflare medical image analysis failed." };
}
