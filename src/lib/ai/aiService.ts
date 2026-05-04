import { env } from "@/lib/env";
import { analyzeImageFull } from "@/lib/ai/cloudflare";
import type { MedicalImageResult } from "@/lib/ai/imageAnalysis";
import {
  generateMedicalResponse,
  type MedicalResponseShape,
} from "@/lib/ai/gemini";
import {
  processUserInput,
  type HealthAgentInput,
  type HealthAgentOutput,
} from "@/lib/ai/agent";
import {
  geminiDoctorCopilotReport,
  geminiRiskPrediction,
  type DoctorCopilotReport,
  type RiskPrediction,
} from "@/lib/backend/gemini";
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
import { getModelRegistry } from "@/lib/ai/modelRegistry";
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
  | MedicalResponseShape
  | MedicalImageResult
  | HealthAgentOutput
  | RiskPrediction
  | DoctorCopilotReport
  | { diagnosis: string; riskLevel: "low" | "medium" | "high"; confidence: number; recommendations: string[] }
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

const triageFallback = {
  diagnosis: "AI unavailable",
  riskLevel: "low" as const,
  confidence: 0,
  recommendations: ["Please consult a healthcare professional for proper evaluation"],
};

const TRIAGE_SYSTEM_PROMPT = [
  "You are MedBridge AI triage assistant.",
  "Return concise clinical guidance without diagnosis certainty claims.",
  "Prioritize red-flag escalation, safety, and plain language.",
].join(" ");

export async function runSymptomTriage(input: {
  message: string;
  bodyPart?: string | null;
}): Promise<{ diagnosis: string; riskLevel: "low" | "medium" | "high"; confidence: number; recommendations: string[] } | { error: string }> {
  if (!env.GEMINI_API_KEY?.trim()) {
    return triageFallback;
  }

  try {
    const response = await generateMedicalResponse({
      message: `${TRIAGE_SYSTEM_PROMPT}\nPatient input: ${input.message}`,
      bodyPart: input.bodyPart,
    });

    if ('error' in response) {
      return triageFallback;
    }

    // Transform MedicalResponseShape to the required format
    const diagnosis = response.possibleConditions?.[0] || "Symptoms require professional evaluation";
    const riskLevel = response.urgency === "urgent" ? "high" : response.urgency === "medium" ? "medium" : "low";
    const confidence = response.urgency === "urgent" ? 0.9 : response.urgency === "medium" ? 0.7 : 0.5;
    const recommendations = response.nextSteps || ["Please consult a healthcare professional"];

    return {
      diagnosis,
      riskLevel,
      confidence,
      recommendations
    };
  } catch (error) {
    console.error('Symptom triage error:', error);
    return triageFallback;
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
    model: "gemini",
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
  const modelVersion = getModelRegistry().gemini.version;
  await appendAuditTrail({ patientId: input.patientId, input: redactObject(input), output: redactObject(result), reasoningSummary: "health assistant longitudinal reasoning", modelVersion });
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
  if (!env.GEMINI_API_KEY?.trim()) {
    return { error: "AI unavailable" };
  }

  try {
    if (input.patientId) {
      const memory = await buildPatientMemory(input.patientId, input.repoPrincipal);
      const trajectory = calculateRiskTrajectory(memory);
      eventBus.emit("ai:risk_trajectory_updated", { patientId: input.patientId, trajectory, timestamp: new Date().toISOString() });
      const warning = getEarlyWarning(memory);
      if (warning) eventBus.emit("ai:early_warning", warning);
      await refreshDigitalTwin(input.patientId, input.repoPrincipal);
    }
    const prediction = await withFailureRecovery(
      () => trackAiRequest({ patientId: input.patientId, endpoint: "runRiskPrediction", model: "gemini", run: () => geminiRiskPrediction(input) }),
      { patientId: input.patientId },
    );
    enforceSafety({ patientId: input.patientId, text: prediction.rationale, riskLevel: prediction.risk_level });
    await appendAuditTrail({ patientId: input.patientId, input: redactObject(input), output: redactObject(prediction), reasoningSummary: "risk prediction trajectory", modelVersion: getModelRegistry().gemini.version });
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
  if (!env.GEMINI_API_KEY?.trim()) {
    return { error: "AI unavailable" };
  }

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
    const report = await withFailureRecovery(
      () => trackAiRequest({ patientId: input.patientId, endpoint: "generateDoctorCopilotReport", model: "gemini", run: () => geminiDoctorCopilotReport(input) }),
      { patientId: input.patientId },
    );
    const explanation = generateExplanation({ result: report });
    await appendAuditTrail({ patientId: input.patientId, input: redactObject(input), output: redactObject(report), reasoningSummary: explanation.summary, modelVersion: getModelRegistry().gemini.version });
    void normalizeAiResponse({ data: { report }, model: "gemini", explanation, confidence: 0.78, riskLevel: "medium" });
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
