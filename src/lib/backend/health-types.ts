export type AIAnalysisResponse = {
  request_id: string;
  patient_id: string;
  summary: string;
  risk_level: "critical" | "high" | "medium" | "low";
  critical_alerts: string[];
  recommendations: string[];
  suggested_actions: string[];
  follow_up_required: boolean;
  requires_specialist: string | null;
  clinician_review_required: boolean;
  confidence_score: number;
};

