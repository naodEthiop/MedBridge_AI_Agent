import { createSupabaseServerClient, doesSupabaseTableExist } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/env";
import type { Appointment, Doctor, Patient } from "@/lib/types";
import { DEMO_APPOINTMENTS } from "@/lib/server/demo-appointments";

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
  source: "supabase" | "mock";
};

const DEMO_PATIENTS: Patient[] = [
  {
    id: "demo-patient",
    fullName: "Demo Patient",
    dateOfBirth: new Date(1990, 0, 1).toISOString().split("T")[0],
    sex: "female",
    phone: undefined,
    email: "demo.patient@example.com",
    primaryDoctorId: "demo-doctor",
    allergies: ["None"],
    conditions: ["General wellness"],
  },
];

const DEMO_DOCTORS: Doctor[] = [
  {
    id: "demo-doctor",
    fullName: "Dr. Demo",
    specialty: "Primary Care",
    clinicName: "MedBridge Demo Clinic",
    phone: "+1 (555) 123-4567",
    email: "demo.doctor@example.com",
  },
];

function createMockRepositories(): Repositories {
  return {
    source: "mock",
    patients: {
      async listPatients() {
        return DEMO_PATIENTS;
      },
      async getPatient(id) {
        return DEMO_PATIENTS.find((patient) => patient.id === id) ?? null;
      },
    },
    doctors: {
      async listDoctors() {
        return DEMO_DOCTORS;
      },
      async getDoctor(id) {
        return DEMO_DOCTORS.find((doctor) => doctor.id === id) ?? null;
      },
    },
    appointments: {
      async listAppointments() {
        return DEMO_APPOINTMENTS;
      },
      async listAppointmentsForPatient(patientId) {
        return DEMO_APPOINTMENTS.filter((appointment) => appointment.patientId === patientId);
      },
    },
  };
}

function createSupabaseRepositories(): Repositories {
  const supabase = hasSupabasePublicEnv ? createSupabaseServerClient() : null;

  return {
    source: hasSupabasePublicEnv ? "supabase" : "mock",
    patients: {
      async listPatients() {
        if (supabase && (await doesSupabaseTableExist("patients"))) {
          console.log("Using Supabase");
          const { data, error } = await supabase
            .from("patients")
            .select("*")
            .order("full_name", { ascending: true });
          if (!error) {
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
          }
        }

        console.log("Using fallback");
        return DEMO_PATIENTS;
      },
      async getPatient(id) {
        if (supabase && (await doesSupabaseTableExist("patients"))) {
          console.log("Using Supabase");
          const { data, error } = await supabase.from("patients").select("*").eq("id", id).maybeSingle();
          if (!error && data) {
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
          }
        }

        console.log("Using fallback");
        return DEMO_PATIENTS.find((patient) => patient.id === id) ?? null;
      },
    },
    doctors: {
      async listDoctors() {
        if (supabase && (await doesSupabaseTableExist("doctors"))) {
          console.log("Using Supabase");
          const { data, error } = await supabase
            .from("doctors")
            .select("*")
            .order("full_name", { ascending: true });
          if (!error) {
            const rows = (data ?? []) as unknown as DoctorRow[];
            return rows.map((row) => ({
              id: row.id,
              fullName: row.full_name,
              specialty: row.specialty,
              clinicName: row.clinic_name ?? undefined,
              phone: row.phone ?? undefined,
              email: row.email ?? undefined,
            })) as Doctor[];
          }
        }

        console.log("Using fallback");
        return DEMO_DOCTORS;
      },
      async getDoctor(id) {
        if (supabase && (await doesSupabaseTableExist("doctors"))) {
          console.log("Using Supabase");
          const { data, error } = await supabase.from("doctors").select("*").eq("id", id).maybeSingle();
          if (!error && data) {
            const row = data as unknown as DoctorRow;
            return {
              id: row.id,
              fullName: row.full_name,
              specialty: row.specialty,
              clinicName: row.clinic_name ?? undefined,
              phone: row.phone ?? undefined,
              email: row.email ?? undefined,
            } as Doctor;
          }
        }

        console.log("Using fallback");
        return DEMO_DOCTORS.find((doctor) => doctor.id === id) ?? null;
      },
    },
    appointments: {
      async listAppointments() {
        if (supabase && (await doesSupabaseTableExist("appointments"))) {
          console.log("Using Supabase");
          const { data, error } = await supabase.from("appointments").select("*").order("start_time", { ascending: false });
          if (!error) {
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
          }
        }

        console.log("Using fallback");
        return DEMO_APPOINTMENTS;
      },
      async listAppointmentsForPatient(patientId) {
        if (supabase && (await doesSupabaseTableExist("appointments"))) {
          console.log("Using Supabase");
          const { data, error } = await supabase
            .from("appointments")
            .select("*")
            .eq("patient_id", patientId)
            .order("start_time", { ascending: false });
          if (!error) {
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
          }
        }

        console.log("Using fallback");
        return DEMO_APPOINTMENTS.filter((appointment) => appointment.patientId === patientId);
      },
    },
  };
}

export function getRepositories(): Repositories {
  if (!hasSupabasePublicEnv) {
    return createMockRepositories();
  }

  try {
    return createSupabaseRepositories();
  } catch {
    return createMockRepositories();
  }
}

