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
  | { error: string };

export async function runSymptomTriage(input: {
  message: string;
  bodyPart?: string | null;
}): Promise<MedicalResponseShape | { error: string }> {
  if (!env.GEMINI_API_KEY?.trim()) {
    return { error: "AI unavailable" };
  }

  return generateMedicalResponse({
    message: input.message,
    bodyPart: input.bodyPart,
  });
}

export async function runImageAnalysis(image: File | Blob): Promise<MedicalImageResult> {
  return analyzeImageFull(image);
}

export async function runHealthAssistant(input: HealthAgentInput): Promise<HealthAgentOutput> {
  return processUserInput(input);
}

export async function runRiskPrediction(input: {
  demographics: string;
  symptomsHistory: string;
  timelineSummary: string;
  labsSummary: string;
}): Promise<RiskPrediction | { error: string }> {
  if (!env.GEMINI_API_KEY?.trim()) {
    return { error: "AI unavailable" };
  }

  try {
    return await geminiRiskPrediction(input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Risk prediction failed" };
  }
}

export async function generateDoctorCopilotReport(input: {
  patientProfile: string;
  timelineSummary: string;
  labsSummary: string;
  appointmentsSummary: string;
}): Promise<DoctorCopilotReport | { error: string }> {
  if (!env.GEMINI_API_KEY?.trim()) {
    return { error: "AI unavailable" };
  }

  try {
    return await geminiDoctorCopilotReport(input);
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

export async function runAI(request: AiServiceRequest): Promise<AiServiceResponse> {
  switch (request.mode) {
    case "symptom_triage":
      return runSymptomTriage({ message: request.message, bodyPart: request.bodyPart });
    case "image_analysis":
      return runImageAnalysis(request.file);
    case "health_assistant":
      return runHealthAssistant(request.input);
    case "risk_prediction":
      return runRiskPrediction(request.input);
    case "doctor_copilot":
      return generateDoctorCopilotReport(request.input);
    default:
      return { error: "Unsupported AI request type." };
  }
}
