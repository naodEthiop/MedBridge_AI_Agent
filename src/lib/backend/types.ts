export type UrgencyLevel = "low" | "medium" | "urgent";

export type AiTriageResponse = {
  message: string;
  urgency: UrgencyLevel;
  redFlags: string[];
  followUpQuestions: string[];
  doctorSummary: string;
  recommendedAction: string;
  confidence: number;
  nextStep: "ask_more" | "create_case" | "emergency";
  nearestHospital?: {
    name: string;
    distanceKm: number;
    etaMinutes: number;
    phone: string;
  };
};

export type PrescriptionAnalysis = {
  detected: boolean;
  confidence: "possible" | "likely" | "high";
  medicine?: string;
  dosage?: string;
  timing?: string;
  summary?: string;
};

export type NearbyPlace = {
  id: string;
  name: string;
  address: string | null;
  distanceMeters: number | null;
  lat: number;
  lng: number;
  categories: string[];
  phone: string | null;
  website: string | null;
};

export type McpToolName =
  | "symptom_checker"
  | "analyze_image"
  | "get_nearby_hospitals"
  | "get_patient_data"
  | "save_doctor_notes";

export type McpToolRequest =
  | {
      tool: "symptom_checker";
      input: { message: string; bodyPart?: string | null };
    }
  | {
      tool: "analyze_image";
      input: { kind: "prescription" | "derm" | "medication"; mimeType: string; base64Data: string; hintText?: string };
    }
  | {
      tool: "get_nearby_hospitals";
      input: { lat: number; lng: number; categories: Array<"hospital" | "clinic" | "pharmacy">; radiusMeters?: number };
    }
  | { tool: "get_patient_data"; input: { patientId: string } }
  | {
      tool: "save_doctor_notes";
      input: {
        patientId: string;
        doctorId: string | null;
        subjective: string;
        bp: string | null;
        heartRate: string | null;
        assessment: string;
        status: "draft" | "signed";
      };
    };

