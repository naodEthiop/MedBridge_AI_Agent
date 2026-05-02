import { NextRequest, NextResponse } from "next/server";

import type { AIAnalysisResponse } from "@/lib/backend/health-types";
import { fetchPatientClinicalProfile, saveClinicalObservation } from "@/lib/backend/supabase-health";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, observation } = body as { patientId?: string; observation?: string };
    if (!patientId || !observation) {
      return NextResponse.json({ error: "Missing required fields: patientId, observation" }, { status: 400 });
    }

    const patientProfile = await fetchPatientClinicalProfile(patientId);
    if (!patientProfile) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

    const recordId = await saveClinicalObservation(patientId, "clinician-id", observation, {});
    const criticalAlerts: string[] = [];
    const vitals = patientProfile.vitals?.vitals as Array<{ is_critical?: boolean }> | undefined;
    const labs = patientProfile.lab_results?.lab_results as Array<{ is_critical?: boolean }> | undefined;
    if (vitals?.some((v) => v.is_critical)) {
      criticalAlerts.push("Critical vital signs detected.");
    }
    if (labs?.some((l) => l.is_critical)) {
      criticalAlerts.push("Critical lab values detected.");
    }

    const response: AIAnalysisResponse = {
      request_id: recordId || `analysis_${Date.now()}`,
      patient_id: patientId,
      summary: observation,
      risk_level: criticalAlerts.length ? "high" : "low",
      critical_alerts: criticalAlerts,
      recommendations: criticalAlerts.length ? ["Escalate to specialist review"] : ["Continue current management"],
      suggested_actions: criticalAlerts.length ? ["Schedule follow-up within 24 hours"] : ["Document observation"],
      follow_up_required: criticalAlerts.length > 0,
      requires_specialist: criticalAlerts.length ? "Internal Medicine" : null,
      clinician_review_required: true,
      confidence_score: 0.72,
    };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}

