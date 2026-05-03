export type ID = string;

export type Patient = {
  id: ID;
  fullName: string;
  dateOfBirth: string; // ISO date
  sex: "female" | "male" | "other";
  phone?: string;
  email?: string;
  primaryDoctorId?: ID;
  allergies?: string[];
  conditions?: string[];
};

export type Doctor = {
  id: ID;
  fullName: string;
  specialty: string;
  clinicName?: string;
  phone?: string;
  email?: string;
};

export type Appointment = {
  id: ID;
  patientId: ID;
  doctorId: ID;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  status: "scheduled" | "completed" | "cancelled";
  urgency?: "low" | "medium" | "high" | "emergency";
  reason?: string;
  location?: string;
};

export type MedicalTimelineEvent = {
  id: ID;
  patientId: ID;
  eventType: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  source: "ai" | "doctor" | "system" | "lab";
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type MessageRecord = {
  id: ID;
  senderId: ID;
  receiverId: ID;
  role: "patient" | "doctor" | "ai";
  message: string;
  attachments: Record<string, unknown>;
  read: boolean;
  createdAt: string;
};

export type LabRecord = {
  id: ID;
  patientId: ID;
  testName: string;
  result: string;
  normalRange?: string;
  createdAt: string;
};

export type RiskPrediction = {
  risk_score: number;
  risk_level: "low" | "medium" | "high" | "critical";
  predicted_conditions: string[];
  recommended_actions: string[];
  escalation_required: boolean;
  rationale: string;
};

export type DoctorCopilotReport = {
  patientSummary: string;
  abnormalities: string[];
  differentialDiagnoses: string[];
  treatmentRecommendations: string[];
  doctorNotes: string;
  takeaway: string;
};

export type PatientState = {
  current_risk_level: "low" | "medium" | "high" | "critical";
  active_conditions: string[];
  last_ai_assessment?: string;
  next_appointment_priority?: string;
  emergency_flag: boolean;
  assigned_doctor?: {
    id: ID;
    fullName: string;
    specialty: string;
    clinicName?: string;
    phone?: string;
    email?: string;
  };
  timeline_summary: string[];
};

