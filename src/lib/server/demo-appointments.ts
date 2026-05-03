import type { Appointment } from "@/lib/types";

/** Safe fallback when Supabase `appointments` is empty or unreachable (additive demo mode). */
export const DEMO_APPOINTMENTS: Appointment[] = [
  {
    id: "demo-appt-1",
    patientId: "demo-patient",
    doctorId: "demo-doctor",
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
    status: "scheduled",
    reason: "Follow-up (demo)",
    location: "MedBridge Demo Clinic",
  },
];
