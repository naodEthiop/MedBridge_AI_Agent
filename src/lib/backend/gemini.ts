import { generateGeminiResponse } from "@/lib/ai/geminiClient";
import { RiskPrediction, DoctorCopilotReport } from "@/lib/types";
export { type RiskPrediction, type DoctorCopilotReport };

export type MedixHealthResponse = {
  message: string;
  urgency: "low" | "medium" | "urgent";
  possibleConditions: string[];
  nextSteps: string[];
  redFlags: string[];
};

export type AiTriageResponse = {
  message: string;
  urgency: "low" | "medium" | "urgent";
  redFlags: string[];
  possibleConditions: string[];
  nextSteps: string[];
};

async function callGemini(prompt: string) {
  const raw = await generateGeminiResponse(prompt);
  const cleaned = String(raw).replace(/```json/i, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error(`Gemini parse failed: ${error instanceof Error ? error.message : String(error)}; raw=${cleaned}`);
  }
}

export async function geminiSymptomTriage(input: { message: string; bodyPart: string | null }): Promise<AiTriageResponse> {
  const prompt = `You are a medical triage AI. Analyze the following symptoms: "${input.message}" ${input.bodyPart ? `for body part: ${input.bodyPart}` : ""}.
  Return JSON only: { "message": string, "urgency": "low"|"medium"|"urgent", "redFlags": string[], "possibleConditions": string[], "nextSteps": string[] }`;

  try {
    return await callGemini(prompt);
  } catch (e) {
    console.error("geminiSymptomTriage failed", e);
    return {
      message: "AI triage is currently unavailable. Please seek medical attention if your symptoms are severe.",
      urgency: "medium",
      redFlags: ["Unable to analyze red flags at this time."],
      possibleConditions: [],
      nextSteps: ["Consult a doctor if symptoms persist."],
    };
  }
}

export async function geminiMedixHealthResponse(message: string): Promise<MedixHealthResponse> {
  const prompt = `You are Medix, a health assistant. Respond to: "${message}".
  Return JSON only: { "message": string, "urgency": "low"|"medium"|"urgent", "possibleConditions": string[], "nextSteps": string[], "redFlags": string[] }`;

  try {
    return await callGemini(prompt);
  } catch (e) {
    console.error("geminiMedixHealthResponse failed", e);
    return {
      message: "I'm having trouble connecting right now. How else can I help you?",
      urgency: "low",
      possibleConditions: [],
      nextSteps: [],
      redFlags: [],
    };
  }
}

export async function geminiRiskPrediction(input: any): Promise<RiskPrediction> {
  const prompt = `Predict health risk for: ${JSON.stringify(input)}.
  Return JSON only: { "risk_score": number, "risk_level": "low"|"medium"|"high"|"critical", "predicted_conditions": string[], "recommended_actions": string[], "escalation_required": boolean, "rationale": string }`;

  try {
    return await callGemini(prompt);
  } catch (e) {
    console.error("geminiRiskPrediction failed", e);
    return {
      risk_score: 0,
      risk_level: "low",
      predicted_conditions: [],
      recommended_actions: [],
      escalation_required: false,
      rationale: "Risk prediction unavailable.",
    };
  }
}

export async function geminiDoctorCopilotReport(input: any): Promise<DoctorCopilotReport> {
  const prompt = `Generate a doctor copilot report for: ${JSON.stringify(input)}.
  Return JSON only: { "patientSummary": string, "abnormalities": string[], "differentialDiagnoses": string[], "treatmentRecommendations": string[], "doctorNotes": string, "takeaway": string }`;

  try {
    return await callGemini(prompt);
  } catch (e) {
    console.error("geminiDoctorCopilotReport failed", e);
    return {
      patientSummary: "Report unavailable.",
      abnormalities: [],
      differentialDiagnoses: [],
      treatmentRecommendations: [],
      doctorNotes: "Unable to generate notes.",
      takeaway: "Please review the patient data manually.",
    };
  }
}

export async function geminiAnalyzeImage(input: {
  kind: string;
  mimeType: string;
  base64Data: string;
  hintText?: string;
}): Promise<{
  medicationName: string | null;
  confidence: number;
  summary: string;
  usage?: string;
  warnings?: string[];
}> {
  const prompt = `Analyze this ${input.kind} image (${input.mimeType}). ${input.hintText ?? ""}.
  Return JSON only: { "medicationName": string|null, "confidence": number, "summary": string, "usage": string, "warnings": string[] }`;

  try {
    return await callGemini(prompt + "\n\n[Note: This is a vision request. Assume the user provided an image.]");
  } catch (e) {
    console.error("geminiAnalyzeImage failed", e);
    return {
      medicationName: null,
      confidence: 0,
      summary: "Image analysis is currently unavailable.",
      usage: "",
      warnings: [],
    };
  }
}
