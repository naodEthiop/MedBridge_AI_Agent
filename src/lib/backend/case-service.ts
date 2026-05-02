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
type CaseRecord = CaseInput & { id: string; createdAt: string };

function createSupabaseWithAccessToken(accessToken: string) {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function listCases(limit = 50, accessToken?: string): Promise<CaseRecord[]> {
  const repos = getRepositories();
  if (repos.source === "supabase") {
    if (!accessToken) {
      return [];
    }
    try {
      const supabase = createSupabaseWithAccessToken(accessToken);
      const { data, error } = await supabase
        .from("cases")
        .select("id, created_at, symptoms, urgency, red_flags, doctor_summary, patient_name, nearest_hospital")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (!error && data) {
        return data.map((row) => ({
          id: row.id as string,
          createdAt: row.created_at as string,
          symptoms: String(row.symptoms ?? ""),
          urgency: (row.urgency as "medium" | "urgent") ?? "medium",
          redFlags: (row.red_flags as string[] | null) ?? [],
          doctorSummary: String(row.doctor_summary ?? ""),
          patientName: (row.patient_name as string | null) ?? undefined,
          nearestHospital: (row.nearest_hospital as CaseInput["nearestHospital"] | null) ?? undefined,
        }));
      }
    } catch {
      // Graceful fallback below.
    }
  }
  return [...inMemoryCases].reverse().slice(0, limit);
}

export async function getCaseById(id: string, accessToken?: string): Promise<CaseRecord | null> {
  const repos = getRepositories();
  if (repos.source === "supabase") {
    if (!accessToken) {
      return null;
    }
    try {
      const supabase = createSupabaseWithAccessToken(accessToken);
      const { data, error } = await supabase
        .from("cases")
        .select("id, created_at, symptoms, urgency, red_flags, doctor_summary, patient_name, nearest_hospital")
        .eq("id", id)
        .maybeSingle();
      if (!error && data) {
        return {
          id: data.id as string,
          createdAt: data.created_at as string,
          symptoms: String(data.symptoms ?? ""),
          urgency: (data.urgency as "medium" | "urgent") ?? "medium",
          redFlags: (data.red_flags as string[] | null) ?? [],
          doctorSummary: String(data.doctor_summary ?? ""),
          patientName: (data.patient_name as string | null) ?? undefined,
          nearestHospital: (data.nearest_hospital as CaseInput["nearestHospital"] | null) ?? undefined,
        };
      }
    } catch {
      // Graceful fallback below.
    }
  }

  return inMemoryCases.find((c) => c.id === id) ?? null;
}

export async function createCase(input: CaseInput, accessToken?: string) {
  const repos = getRepositories();

  // If we are on Supabase-backed mode and a `cases` table exists, store there.
  if (repos.source === "supabase" && accessToken) {
    try {
      const supabase = createSupabaseWithAccessToken(accessToken);
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        throw userErr ?? new Error("No user for case insert");
      }
      const payload = {
        user_id: userData.user.id,
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

