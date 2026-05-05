import type { Appointment, Doctor, Patient } from "@/lib/types";
import { requirePublicApiBaseUrl } from "@/lib/env";

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

function url(path: string) {
  const base = requirePublicApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

import { safeFetch } from "./safeFetch";

async function getJson<T>(path: string): Promise<ApiResult<T>> {
  const result = await safeFetch<T>(url(path));
  if (!result.success) {
    return { ok: false, error: result.error || "Unknown error", status: 500 };
  }
  return { ok: true, data: result.data as T };
}

export async function health() {
  return getJson<{ ok: true }>("/api/health");
}

export async function listPatients() {
  return getJson<{ patients: Patient[] }>("/api/patients");
}

export async function getPatient(id: string) {
  return getJson<{ patient: Patient; appointments: Appointment[] }>(`/api/patients/${encodeURIComponent(id)}`);
}

export async function listDoctors() {
  return getJson<{ doctors: Doctor[] }>("/api/doctors");
}

export async function listAppointments() {
  return getJson<{ appointments: Appointment[] }>("/api/appointments");
}

export async function triageSymptom(payload: { message: string; userLat?: number; userLng?: number; patientName?: string }) {
  const result = await safeFetch<any>(url("/api/mcp"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      tool: "symptom_checker",
      input: { message: payload.message, bodyPart: null },
    }),
  });
  if (!result.success) return { ok: false as const, error: result.error || "Triage failed", status: 500 };
  return { ok: true as const, data: result.data };
}

export async function scanPrescription(file: File) {
  const form = new FormData();
  form.append("file", file);
  const result = await safeFetch<any>(url("/api/prescription"), { method: "POST", body: form });
  if (!result.success) return { ok: false as const, error: result.error || "Scan failed", status: 500 };
  return { ok: true as const, data: result.data };
}

export async function getNearbyHospitals(payload: { latitude?: number; longitude?: number }) {
  const lat = payload.latitude ?? 0;
  const lng = payload.longitude ?? 0;
  
  const result = await safeFetch<{ success: boolean; data: any[] }>(url(`/api/nearby?lat=${lat}&lng=${lng}`));
  
  if (!result.success) return { ok: false as const, error: result.error || "Failed to fetch nearby doctors", status: 500 };
  
  return { 
    ok: true as const, 
    data: {
      tool: "get_nearby_hospitals",
      result: {
        places: (result.data?.data || []).map(d => ({
          id: d.id,
          name: d.full_name || d.name,
          address: d.specialization || d.address,
          lat: d.lat,
          lon: d.lng,
          distanceMeters: d.distance ? d.distance * 1000 : null
        })),
        location: { lat, lng }
      }
    }
  };
}

export async function analyzeImage(payload: {
  kind: "prescription" | "derm" | "medication";
  mimeType: string;
  base64Data: string;
  hintText?: string;
}) {
  const result = await safeFetch<any>(url("/api/mcp"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ tool: "analyze_image", input: payload }),
  });
  if (!result.success) return { ok: false as const, error: result.error || "Analysis failed", status: 500 };
  return { ok: true as const, data: result.data };
}

export async function saveDoctorNotes(payload: {
  patientId: string;
  doctorId: string | null;
  subjective: string;
  bp: string | null;
  heartRate: string | null;
  assessment: string;
  status: "draft" | "signed";
}) {
  const result = await safeFetch<any>(url("/api/mcp"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ tool: "save_doctor_notes", input: payload }),
  });
  if (!result.success) return { ok: false as const, error: result.error || "Save failed", status: 500 };
  return { ok: true as const, data: result.data };
}

export async function findPharmacies(payload: { medicine: string; latitude?: number; longitude?: number }) {
  const result = await safeFetch<any>(url("/api/pharmacies"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!result.success) return { ok: false as const, error: result.error || "Pharmacies lookup failed", status: 500 };
  return { ok: true as const, data: result.data };
}

export async function verifyProvider(payload: { providerName: string; licenseNumber?: string; clinic?: string }) {
  const result = await safeFetch<any>(url("/api/provider/verify"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!result.success) return { ok: false as const, error: result.error || "Verification failed", status: 500 };
  return { ok: true as const, data: result.data };
}

export async function triggerUiAction(action: string, payload?: Record<string, unknown>) {
  const result = await safeFetch<any>(url("/api/actions"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ action, payload: payload ?? {} }),
  });
  if (!result.success) return { ok: false as const, error: result.error || "Action failed", status: 500 };
  return { ok: true as const, data: result.data as { message?: string; action?: string } };
}

