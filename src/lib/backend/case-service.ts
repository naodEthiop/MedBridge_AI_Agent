import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import { getRepositories } from "@/lib/server/repositories";

type CaseInput = {
  symptoms: string;
  urgency: "medium" | "urgent";
  redFlags: string[];
  doctorSummary: string;
  patientName?: string;
  nearestHospital?: {
    name: string;
    distanceKm: number;
    etaMinutes: number;
    phone: string;
  };
};

const inMemoryCases: Array<CaseInput & { id: string; createdAt: string }> = [];

export async function createCase(input: CaseInput) {
  const repos = getRepositories();

  // If we are on Supabase-backed mode and a `cases` table exists, store there.
  if (repos.source === "supabase") {
    try {
      const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const payload = {
        symptoms: input.symptoms,
        urgency: input.urgency,
        red_flags: input.redFlags,
        doctor_summary: input.doctorSummary,
        patient_name: input.patientName ?? null,
        nearest_hospital: input.nearestHospital ?? null,
      };
      const { data, error } = await supabase.from("cases").insert(payload).select("id, created_at").maybeSingle();
      if (!error && data) {
        return { id: data.id as string, createdAt: data.created_at as string, persisted: true };
      }
    } catch {
      // Graceful fallback below.
    }
  }

  const created = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  inMemoryCases.push(created);
  return { id: created.id, createdAt: created.createdAt, persisted: false };
}

