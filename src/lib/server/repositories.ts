import { createClient } from "@supabase/supabase-js";

import { env, hasSupabasePublicEnv } from "@/lib/env";
import type { Appointment, Doctor, Patient } from "@/lib/types";

type PatientRow = {
  id: string;
  full_name: string;
  date_of_birth: string;
  sex: Patient["sex"];
  phone: string | null;
  email: string | null;
  primary_doctor_id: string | null;
  allergies: string[] | null;
  conditions: string[] | null;
};

type DoctorRow = {
  id: string;
  full_name: string;
  specialty: string;
  clinic_name: string | null;
  phone: string | null;
  email: string | null;
};

type AppointmentRow = {
  id: string;
  patient_id: string;
  doctor_id: string;
  start_time: string;
  end_time: string;
  status: Appointment["status"];
  reason: string | null;
  location: string | null;
};

type PatientRepository = {
  listPatients(): Promise<Patient[]>;
  getPatient(id: string): Promise<Patient | null>;
};

type DoctorRepository = {
  listDoctors(): Promise<Doctor[]>;
  getDoctor(id: string): Promise<Doctor | null>;
};

type AppointmentRepository = {
  listAppointments(): Promise<Appointment[]>;
  listAppointmentsForPatient(patientId: string): Promise<Appointment[]>;
};

export type Repositories = {
  patients: PatientRepository;
  doctors: DoctorRepository;
  appointments: AppointmentRepository;
  source: "supabase";
};

function createSupabaseRepositories(): Repositories {
  if (!hasSupabasePublicEnv) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  // Minimal schema expectation:
  // - patients: id, full_name, date_of_birth, sex, phone, email, primary_doctor_id, allergies, conditions
  // - doctors: id, full_name, specialty, clinic_name, phone, email
  // - appointments: id, patient_id, doctor_id, start_time, end_time, status, reason, location
  return {
    source: "supabase",
    patients: {
      async listPatients() {
        const { data, error } = await supabase
          .from("patients")
          .select("*")
          .order("full_name", { ascending: true });
        if (error) throw error;
        const rows = (data ?? []) as unknown as PatientRow[];
        return rows.map((row) => ({
          id: row.id,
          fullName: row.full_name,
          dateOfBirth: row.date_of_birth,
          sex: row.sex,
          phone: row.phone ?? undefined,
          email: row.email ?? undefined,
          primaryDoctorId: row.primary_doctor_id ?? undefined,
          allergies: row.allergies ?? undefined,
          conditions: row.conditions ?? undefined,
        })) as Patient[];
      },
      async getPatient(id) {
        const { data, error } = await supabase.from("patients").select("*").eq("id", id).maybeSingle();
        if (error) throw error;
        if (!data) return null;
        const row = data as unknown as PatientRow;
        return {
          id: row.id,
          fullName: row.full_name,
          dateOfBirth: row.date_of_birth,
          sex: row.sex,
          phone: row.phone ?? undefined,
          email: row.email ?? undefined,
          primaryDoctorId: row.primary_doctor_id ?? undefined,
          allergies: row.allergies ?? undefined,
          conditions: row.conditions ?? undefined,
        } as Patient;
      },
    },
    doctors: {
      async listDoctors() {
        const { data, error } = await supabase
          .from("doctors")
          .select("*")
          .order("full_name", { ascending: true });
        if (error) throw error;
        const rows = (data ?? []) as unknown as DoctorRow[];
        return rows.map((row) => ({
          id: row.id,
          fullName: row.full_name,
          specialty: row.specialty,
          clinicName: row.clinic_name ?? undefined,
          phone: row.phone ?? undefined,
          email: row.email ?? undefined,
        })) as Doctor[];
      },
      async getDoctor(id) {
        const { data, error } = await supabase.from("doctors").select("*").eq("id", id).maybeSingle();
        if (error) throw error;
        if (!data) return null;
        const row = data as unknown as DoctorRow;
        return {
          id: row.id,
          fullName: row.full_name,
          specialty: row.specialty,
          clinicName: row.clinic_name ?? undefined,
          phone: row.phone ?? undefined,
          email: row.email ?? undefined,
        } as Doctor;
      },
    },
    appointments: {
      async listAppointments() {
        const { data, error } = await supabase.from("appointments").select("*").order("start_time", { ascending: false });
        if (error) throw error;
        const rows = (data ?? []) as unknown as AppointmentRow[];
        return rows.map((row) => ({
          id: row.id,
          patientId: row.patient_id,
          doctorId: row.doctor_id,
          startTime: row.start_time,
          endTime: row.end_time,
          status: row.status,
          reason: row.reason ?? undefined,
          location: row.location ?? undefined,
        })) as Appointment[];
      },
      async listAppointmentsForPatient(patientId) {
        const { data, error } = await supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", patientId)
          .order("start_time", { ascending: false });
        if (error) throw error;
        const rows = (data ?? []) as unknown as AppointmentRow[];
        return rows.map((row) => ({
          id: row.id,
          patientId: row.patient_id,
          doctorId: row.doctor_id,
          startTime: row.start_time,
          endTime: row.end_time,
          status: row.status,
          reason: row.reason ?? undefined,
          location: row.location ?? undefined,
        })) as Appointment[];
      },
    },
  };
}

export function getRepositories(): Repositories {
  return createSupabaseRepositories();
}

