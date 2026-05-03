import { analyzeMedicalImage, type MedicalImageResult } from "@/lib/ai/imageAnalysis";

export type CloudflareImageSummary = {
  findings: string[];
  confidence: number;
  possibleConditions: string[];
};

/**
 * Cloudflare Workers AI vision wrapper — delegates to `analyzeMedicalImage`.
 * Returns a compact shape or `{ error }` for simple callers.
 */
export async function analyzeImage(file: File | Blob): Promise<CloudflareImageSummary | { error: string }> {
  const result: MedicalImageResult = await analyzeMedicalImage(file);
  if (!result.success) {
    return { error: result.error };
  }
  return {
    findings: result.findings,
    confidence: result.confidence,
    possibleConditions: result.possibleConditions,
  };
}

/** Full vision result including urgency and recommendation (for API routes). */
export async function analyzeImageFull(file: File | Blob): Promise<MedicalImageResult> {
  return analyzeMedicalImage(file);
}
