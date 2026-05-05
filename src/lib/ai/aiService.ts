import { env } from "@/lib/env";
import { analyzeImageFull } from "@/lib/ai/cloudflare";
import type { MedicalImageResult } from "@/lib/ai/imageAnalysis";
import { safeGenerateAI } from "@/lib/ai/openaiClient";
import type { RiskPrediction, DoctorCopilotReport } from "@/lib/types";
import {
  processUserInput,
  type HealthAgentInput,
  type HealthAgentOutput,
} from "@/lib/ai/agent";
import { analyzeClinicalState, calculateRiskTrajectory } from "@/lib/ai/clinicalReasoner";
import { getEarlyWarning } from "@/lib/ai/earlyWarning";
import { buildPatientMemory, summarizePatientMemory } from "@/lib/ai/patientMemory";
import type { RepositoryPrincipal } from "@/lib/server/repositories";
import { eventBus } from "@/lib/server/events";
import { getDigitalTwin, upsertDigitalTwin } from "@/lib/ai/digitalTwin";
import { canApplyTwinUpdate } from "@/lib/ai/digitalTwinGuard";
import { buildForecast, buildRiskCurve } from "@/lib/ai/forecastEngine";
import { buildPatientStateVector } from "@/lib/ai/patientStateVector";
import { simulateTrajectories } from "@/lib/ai/trajectorySimulator";
import { appendAuditTrail } from "@/lib/ai/auditTrail";
import { trackAiRequest } from "@/lib/ai/aiObservability";
import { generateExplanation } from "@/lib/ai/explainability";
import { withFailureRecovery } from "@/lib/ai/failureHandler";
import { redactObject } from "@/lib/ai/privacyFilter";
import { normalizeAiResponse } from "@/lib/ai/responseNormalizer";
import { enforceSafety } from "@/lib/ai/safetyGuard";

export type AiServiceRequest =
  | { mode: "symptom_triage"; message: string; bodyPart?: string | null }
  | { mode: "image_analysis"; file: File | Blob }
  | { mode: "health_assistant"; input: HealthAgentInput }
  | {
      mode: "risk_prediction";
      input: {
        demographics: string;
        symptomsHistory: string;
        timelineSummary: string;
        labsSummary: string;
      };
    }
  | {
      mode: "doctor_copilot";
      input: {
        patientProfile: string;
        timelineSummary: string;
        labsSummary: string;
        appointmentsSummary: string;
      };
    };

export type AiServiceResponse =
  | MedicalImageResult
  | HealthAgentOutput
  | RiskPrediction
  | DoctorCopilotReport
  | { message: string; followUpQuestions: string[]; riskLevel: string; recommendations: string[] }
  | { error: string };


async function refreshDigitalTwin(patientId: string, principal: RepositoryPrincipal) {
  const ts = Date.now();
  if (!canApplyTwinUpdate(patientId, ts)) return getDigitalTwin(patientId);
  const memory = await buildPatientMemory(patientId, principal);
  const stateVector = buildPatientStateVector(memory);
  const forecastModel = buildForecast(stateVector);
  const simulationState = simulateTrajectories(forecastModel);
  const twin = upsertDigitalTwin({ patientId, stateVector, forecastModel, simulationState });
  const riskCurve = buildRiskCurve(forecastModel);

  eventBus.emit("ai:digital_twin_updated", { patientId, version: twin.version, timestamp: new Date(ts).toISOString() });
  eventBus.emit("ai:forecast_updated", { patientId, slopeAnalysis: forecastModel.slopeAnalysis, confidence: forecastModel.confidence, timestamp: new Date(ts).toISOString() });
  eventBus.emit("ai:simulation_updated", { patientId, scenarioCount: simulationState.scenarios.length, timestamp: new Date(ts).toISOString() });

  if (riskCurve.acceleration > 3) {
    eventBus.emit("ai:trajectory_risk_detected", { patientId, acceleration: riskCurve.acceleration, inflectionPoints: riskCurve.inflectionPoints, timestamp: new Date(ts).toISOString() });
    eventBus.emit("ai:intervention_recommendation", { patientId, reason: "High risk acceleration detected", timestamp: new Date(ts).toISOString() });
  }

  if (simulationState.scenarios.some((s) => s.riskCurve[s.riskCurve.length - 1] > 80)) {
    eventBus.emit("ai:early_warning_escalation", { patientId, reason: "High-risk convergence across simulated scenarios", timestamp: new Date(ts).toISOString() });
  }
  eventBus.emit("ai:system_health_ok", { patientId, timestamp: new Date(ts).toISOString() });
  return twin;
}

function enrichUserInput(input: string, history: any[]) {
  const t = input.trim();
  const lastAiMsg = history.filter(m => m.role === "ai" || m.role === "assistant").pop()?.text || "";

  // Handle pain scale (9/10 etc)
  if (/^\d+$/.test(t)) {
    return `The user rates the severity as ${t}/10. Context: The previous question was "${lastAiMsg}"`;
  }

  // Handle common short symptoms
  if (t.toLowerCase() === "tired" || t.toLowerCase() === "fatigue") {
    return `The user is reporting ${t}. Possible fatigue symptom. Context: ${lastAiMsg}`;
  }
  
  if (t.toLowerCase() === "weird" || t.toLowerCase() === "bad") {
    return `The user feels "${t}". They are struggling to describe it. Context: ${lastAiMsg}`;
  }

  return t;
}

const TRIAGE_SYSTEM_PROMPT = `
You are MedBridge AI, an intelligent and empathetic medical assistant.
Your behavior must feel like ChatGPT + a real doctor.

CRITICAL RULES:
1. ALWAYS understand short answers:
- "9" = pain severity
- "tired" = fatigue symptom
- "weird" = unclear feeling -> ask clarification naturally

2. NEVER repeat the same sentence twice.
3. NEVER say "I didn’t fully understand" repeatedly.
4. Always adapt based on conversation history.
5. Respond like a human doctor: Acknowledge, Interpret, Guide, and Ask 1–2 smart follow-up questions.
6. Keep answers natural, not robotic.
7. If user gives symptoms -> analyze; severity -> react; emotion -> respond empathetically.

Risk Levels:
- low -> calm advice
- medium -> caution
- high -> urgent tone

You are allowed to provide general medical guidance.
Do NOT refuse basic symptom analysis. Do NOT over-restrict responses.
Avoid legal disclaimers unless strictly necessary.

Output STRICT JSON:
{
  "message": "Natural conversational doctor response",
  "riskLevel": "low | medium | high",
  "followUp": ["question1", "question2"],
  "advice": ["action1", "action2"]
}

NEVER output generic filler responses. Every response must be unique to the input.
If AI fails, return exactly: "MedBridge AI is not available right now. Please try again later."
`;

const AI_UNAVAILABLE_MESSAGE = {
  message: "MedBridge AI is not available right now. Please try again later.",
  followUpQuestions: [],
  riskLevel: "unknown",
  recommendations: [],
  isError: true,
};

let aiFailureCount = 0;
let lastAiResponse = "";

function getIntent(text: string) {
  const t = text.toLowerCase().trim();

  if (["hi", "hello", "hey", "greeting"].some(w => t.includes(w)) && t.length < 10) return "greeting";

  if (t.includes("who are you") || t.includes("what are you") || t.includes("your purpose")) {
    return "identity";
  }

  if (t.length < 3 || (/^[a-z]+$/i.test(t) && !["pain", "fever", "sick", "ache", "hurt"].includes(t))) return "unknown";

  if (
    t.includes("headache") ||
    t.includes("pain") ||
    t.includes("fever") ||
    t.includes("sick") ||
    t.includes("hurt") ||
    t.includes("cough") ||
    t.includes("sore") ||
    t.includes("vomit") ||
    t.includes("nausea") ||
    t.includes("dizzy")
  ) return "symptom";

  return "general";
}

export async function runSymptomTriage(input: {
  message: string;
  bodyPart?: string | null;
  history?: { role: "user" | "ai"; text: string }[];
}) {
  const userMessage = input.message.trim();
  const history = input.history ?? [];

  // Emergency Stabilization: Runtime check for API Key
  if (!process.env.OPENAI_API_KEY) {
    return AI_UNAVAILABLE_MESSAGE;
  }

  const intent = getIntent(userMessage);
  const enrichedMessage = enrichUserInput(userMessage, history);

  // STEP 2: HANDLE NON-SYMPTOM INPUTS LOCALLY
  if (intent === "greeting") {
    return {
      message: "Hello 👋 I’m MedBridge AI. Tell me your symptoms or how you feel.",
      followUpQuestions: ["Where is the discomfort?", "How long has it been happening?"],
      riskLevel: "low",
      recommendations: [],
      isError: false,
    };
  }

  if (intent === "identity") {
    return {
      message: "I am the MedBridge Online Doctor Assistant. I’m here to provide professional, empathetic guidance to help you understand your symptoms and direct you to the appropriate care. How can I assist you today?",
      followUpQuestions: ["Would you like to start a clinical evaluation of your symptoms?", "Do you have a specific medical concern?"],
      riskLevel: "low",
      recommendations: [],
      isError: false,
    };
  }

  if (intent === "unknown") {
    return {
      message: "I didn’t fully understand that. Can you describe how you’re feeling physically?",
      followUpQuestions: [],
      riskLevel: "low",
      recommendations: [],
      isError: false,
    };
  }

  const fallbackResponse = {
    message: "MedBridge AI is not available right now. Please try again later.",
    riskLevel: "unknown",
    followUp: [],
    advice: [],
    isError: true,
  };

  try {
    // Prevent infinite loops: if last user message was identical to current one
    const lastUserMsg = history.reverse().find(m => m.role === "user")?.text;
    if (lastUserMsg === userMessage) {
      return {
        message: "I've noted that. Could you tell me if anything else is bothering you, or how intense the pain is on a scale of 1-10?",
        followUpQuestions: [],
        riskLevel: "low",
        recommendations: [],
        isError: false,
      };
    }

    const historyPrompt = history.length > 0 
      ? `\nRECENT HISTORY:\n${history.slice(-5).map(m => `${m.role.toUpperCase()}: ${m.text}`).join("\n")}`
      : "";

    // Temperature guard for repetition
    const temperature = (history.length > 0 && history[history.length - 1].text === userMessage) ? 0.9 : 0.7;

    const responseText = await safeGenerateAI(
      enrichedMessage, 
      `${TRIAGE_SYSTEM_PROMPT}${historyPrompt}\n\nUSER INPUT: ${enrichedMessage}\nRESPONSE JSON:`, 
      true
    );
    
    if (!responseText) {
      aiFailureCount++;
      if (aiFailureCount > 2) return AI_UNAVAILABLE_MESSAGE;
      return fallbackResponse;
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseError) {
      console.error("OpenAI Parse Error:", parseError);
    }

    if (!parsed || !parsed.message) {
      aiFailureCount++;
      if (aiFailureCount > 2) return AI_UNAVAILABLE_MESSAGE;
      return fallbackResponse;
    }

    aiFailureCount = 0;

    let cleanResponse = String(parsed.message)
      .replace(/I am not a doctor/gi, "")
      .replace(/cannot provide medical advice/gi, "")
      .trim();

    // LOOP PROTECTION: Avoid repeating the generic "provide details" message
    if (cleanResponse === lastAiResponse || cleanResponse.toLowerCase().includes("provide a few more details")) {
      if (intent === "symptom") {
        cleanResponse = `I see you're mentioning ${userMessage}. To help me understand better, how long has this been bothering you and does it interfere with your daily activities?`;
      } else {
        cleanResponse = "I'm here to help. Could you give me a bit more context about your situation?";
      }
    }

    lastAiResponse = cleanResponse;

    const riskLevel = ["low", "medium", "high"].includes(parsed.riskLevel) ? parsed.riskLevel : "low";
    const followUp = Array.isArray(parsed.followUp) ? parsed.followUp : [];
    const advice = Array.isArray(parsed.advice) ? parsed.advice : [];

    return {
      message: cleanResponse,
      followUp,
      riskLevel,
      advice,
      isError: false,
    };
  } catch (error) {
    console.error("Symptom triage error:", error);
    aiFailureCount++;
    return fallbackResponse;
  }
}

export async function runImageAnalysis(image: File | Blob): Promise<MedicalImageResult> {
  return analyzeImageFull(image);
}

export async function runHealthAssistant(
  input: HealthAgentInput & { patientId?: string; repoPrincipal: RepositoryPrincipal },
): Promise<HealthAgentOutput> {
  const memoryContext = input.patientId
    ? summarizePatientMemory(await buildPatientMemory(input.patientId, input.repoPrincipal))
    : null;
  const result = await trackAiRequest({
    patientId: input.patientId,
    endpoint: "runHealthAssistant",
    model: "openai",
    run: async () => processUserInput({
    ...input,
    message: [memoryContext ? `Longitudinal trend: ${memoryContext.trend}` : null, input.message ?? null].filter(Boolean).join("\n"),
    }),
  });
  if (input.patientId) {
    eventBus.emit("ai:memory_updated", { patientId: input.patientId, timestamp: new Date().toISOString() });
    await refreshDigitalTwin(input.patientId, input.repoPrincipal);
  }
  enforceSafety({ patientId: input.patientId, text: result.message, riskLevel: result.urgency });
  await appendAuditTrail({ patientId: input.patientId, input: redactObject(input), output: redactObject(result), reasoningSummary: "health assistant longitudinal reasoning", modelVersion: "gpt-4o-mini" });
  return result;
}

export async function runRiskPrediction(input: {
  patientId?: string;
  demographics: string;
  symptomsHistory: string;
  timelineSummary: string;
  labsSummary: string;
  repoPrincipal: RepositoryPrincipal;
}): Promise<RiskPrediction | { error: string }> {
  try {
    if (input.patientId) {
      const memory = await buildPatientMemory(input.patientId, input.repoPrincipal);
      const trajectory = calculateRiskTrajectory(memory);
      eventBus.emit("ai:risk_trajectory_updated", { patientId: input.patientId, trajectory, timestamp: new Date().toISOString() });
      const warning = getEarlyWarning(memory);
      if (warning) eventBus.emit("ai:early_warning", warning);
      await refreshDigitalTwin(input.patientId, input.repoPrincipal);
    }

    const prompt = `Predict health risk for: ${JSON.stringify(input)}.
    Return JSON only: { "risk_score": number, "risk_level": "low"|"medium"|"high"|"critical", "predicted_conditions": string[], "recommended_actions": string[], "escalation_required": boolean, "rationale": string }`;

    const prediction = await withFailureRecovery(
      () => trackAiRequest({ patientId: input.patientId, endpoint: "runRiskPrediction", model: "openai", run: async () => {
          const raw = await safeGenerateAI(prompt, "You are MedBridge AI, a friendly and intelligent health risk prediction AI.", true);
          return JSON.parse(raw);
      }}),
      { patientId: input.patientId },
    );
    enforceSafety({ patientId: input.patientId, text: prediction.rationale, riskLevel: prediction.risk_level });
    await appendAuditTrail({ patientId: input.patientId, input: redactObject(input), output: redactObject(prediction), reasoningSummary: "risk prediction trajectory", modelVersion: "gpt-4o-mini" });
    return prediction;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Risk prediction failed" };
  }
}

export async function generateDoctorCopilotReport(input: {
  patientId?: string;
  patientProfile: string;
  timelineSummary: string;
  labsSummary: string;
  appointmentsSummary: string;
  repoPrincipal: RepositoryPrincipal;
}): Promise<DoctorCopilotReport | { error: string }> {
  try {
    if (input.patientId) {
      const state = analyzeClinicalState(await buildPatientMemory(input.patientId, input.repoPrincipal));
      eventBus.emit("ai:clinical_analysis_completed", {
        patientId: input.patientId,
        riskLevel: state.riskLevel,
        confidence: state.confidence,
        timestamp: new Date().toISOString(),
      });
      await refreshDigitalTwin(input.patientId, input.repoPrincipal);
    }

    const prompt = `Generate a doctor copilot report for: ${JSON.stringify(input)}.
    Return JSON only: { "patientSummary": string, "abnormalities": string[], "differentialDiagnoses": string[], "treatmentRecommendations": string[], "doctorNotes": string, "takeaway": string }`;

    const report = await withFailureRecovery(
      () => trackAiRequest({ patientId: input.patientId, endpoint: "generateDoctorCopilotReport", model: "openai", run: async () => {
          const raw = await safeGenerateAI(prompt, "You are a doctor copilot report generator.", true);
          return JSON.parse(raw);
      }}),
      { patientId: input.patientId },
    );
    const explanation = generateExplanation({ result: report });
    await appendAuditTrail({ patientId: input.patientId, input: redactObject(input), output: redactObject(report), reasoningSummary: explanation.summary, modelVersion: "gpt-4o-mini" });
    void normalizeAiResponse({ data: { report }, model: "openai", explanation, confidence: 0.78, riskLevel: "medium" });
    return report;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Doctor copilot report failed" };
  }
}

export async function computePatientState(input: {
  patientId: string;
  patientName: string;
  assignedDoctor?: {
    id: string;
    fullName: string;
    specialty: string;
    clinicName?: string;
    phone?: string;
    email?: string;
  };
  activeConditions: string[];
  lastAiAssessment?: string;
  nextAppointmentPriority?: string;
  currentRiskLevel: "low" | "medium" | "high" | "critical";
  urgentEventPresent: boolean;
  timelineSummary: string[];
}): Promise<{
  current_risk_level: "low" | "medium" | "high" | "critical";
  active_conditions: string[];
  last_ai_assessment?: string;
  next_appointment_priority?: string;
  emergency_flag: boolean;
  assigned_doctor?: {
    id: string;
    fullName: string;
    specialty: string;
    clinicName?: string;
    phone?: string;
    email?: string;
  };
  timeline_summary: string[];
}> {
  return {
    current_risk_level: input.currentRiskLevel,
    active_conditions: input.activeConditions,
    last_ai_assessment: input.lastAiAssessment,
    next_appointment_priority: input.nextAppointmentPriority,
    emergency_flag: input.urgentEventPresent || input.currentRiskLevel === 'critical',
    assigned_doctor: input.assignedDoctor,
    timeline_summary: input.timelineSummary,
  };
}

export async function runAI(
  request: AiServiceRequest,
  repoPrincipal: RepositoryPrincipal,
): Promise<AiServiceResponse> {
  switch (request.mode) {
    case "symptom_triage":
      return runSymptomTriage({ message: request.message, bodyPart: request.bodyPart });
    case "image_analysis":
      return runImageAnalysis(request.file);
    case "health_assistant":
      return runHealthAssistant({ ...request.input, repoPrincipal });
    case "risk_prediction":
      return runRiskPrediction({ ...request.input, repoPrincipal });
    case "doctor_copilot":
      return generateDoctorCopilotReport({ ...request.input, repoPrincipal });
    default:
      return { error: "Unsupported AI request type." };
  }
}
