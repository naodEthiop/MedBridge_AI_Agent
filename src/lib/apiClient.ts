import type { Appointment, Doctor, Patient } from "@/lib/types";
import { requirePublicApiBaseUrl } from "@/lib/env";

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

function url(path: string) {
  const base = requirePublicApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function getJson<T>(path: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url(path), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      return { ok: false, error: await res.text(), status: res.status };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    return { ok: false, error: message, status: 500 };
  }
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
  const res = await fetch(url("/api/mcp"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      tool: "symptom_checker",
      input: { message: payload.message, bodyPart: null },
    }),
  });
  if (!res.ok) return { ok: false as const, error: await res.text(), status: res.status };
  return { ok: true as const, data: (await res.json()) as unknown };
}

export async function scanPrescription(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(url("/api/prescription"), { method: "POST", body: form });
  if (!res.ok) return { ok: false as const, error: await res.text(), status: res.status };
  return { ok: true as const, data: await res.json() };
}

export async function getNearbyHospitals(payload: { latitude?: number; longitude?: number }) {
  const lat = payload.latitude ?? 0;
  const lng = payload.longitude ?? 0;
  
  // Use the dedicated Maps API instead of MCP
  const res = await fetch(url(`/api/maps/nearby?lat=${lat}&lng=${lng}&type=hospital`));
  
  if (!res.ok) return { ok: false as const, error: await res.text(), status: res.status };
  const data = await res.json();
  
  // Normalize response to match the legacy MCP shape for frontend compatibility
  return { 
    ok: true as const, 
    data: {
      tool: "get_nearby_hospitals",
      result: {
        places: data.places || [],
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
  const res = await fetch(url("/api/mcp"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ tool: "analyze_image", input: payload }),
  });
  if (!res.ok) return { ok: false as const, error: await res.text(), status: res.status };
  return { ok: true as const, data: await res.json() };
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
  const res = await fetch(url("/api/mcp"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ tool: "save_doctor_notes", input: payload }),
  });
  if (!res.ok) return { ok: false as const, error: await res.text(), status: res.status };
  return { ok: true as const, data: await res.json() };
}

export async function findPharmacies(payload: { medicine: string; latitude?: number; longitude?: number }) {
  const res = await fetch(url("/api/pharmacies"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { ok: false as const, error: await res.text(), status: res.status };
  return { ok: true as const, data: await res.json() };
}

export async function verifyProvider(payload: { providerName: string; licenseNumber?: string; clinic?: string }) {
  const res = await fetch(url("/api/provider/verify"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { ok: false as const, error: await res.text(), status: res.status };
  return { ok: true as const, data: await res.json() };
}

export async function triggerUiAction(action: string, payload?: Record<string, unknown>) {
  const res = await fetch(url("/api/actions"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ action, payload: payload ?? {} }),
  });
  if (!res.ok) return { ok: false as const, error: await res.text(), status: res.status };
  return { ok: true as const, data: (await res.json()) as { message?: string; action?: string } };
}

