import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

function getSupabase() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function fetchPatientClinicalProfile(patientId: string) {
  const sb = getSupabase();
  if (!sb) return null;

  // Fallback-safe multi-query profile. Missing tables are tolerated.
  const [patient, vitals, labs, meds, allergies] = await Promise.all([
    sb.from("patients").select("*").eq("id", patientId).maybeSingle(),
    sb.from("vitals").select("*").eq("patient_id", patientId).order("recorded_at", { ascending: false }).limit(20),
    sb.from("lab_results").select("*").eq("patient_id", patientId).order("recorded_at", { ascending: false }).limit(20),
    sb.from("medications").select("*").eq("patient_id", patientId),
    sb.from("allergies").select("*").eq("patient_id", patientId),
  ]);

  if (patient.error || !patient.data) return null;

  return {
    patient: patient.data,
    vitals: { vitals: vitals.data ?? [] },
    lab_results: { lab_results: labs.data ?? [] },
    medications: { medications: meds.data ?? [] },
    allergies: { allergies: allergies.data ?? [] },
  };
}

export async function saveClinicalObservation(
  patientId: string,
  clinicianId: string,
  observation: string,
  meta: Record<string, unknown>,
) {
  const sb = getSupabase();
  if (!sb) return `obs_${Date.now()}`;

  const { data, error } = await sb
    .from("clinical_observations")
    .insert({
      patient_id: patientId,
      clinician_id: clinicianId,
      observation,
      meta,
    })
    .select("id")
    .maybeSingle();

  if (error || !data) return `obs_${Date.now()}`;
  return String(data.id);
}

