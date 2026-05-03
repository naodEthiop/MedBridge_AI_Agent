-- Supabase schema for MedBridge fallback and referenced tables
-- Run this in your Supabase project's SQL editor or with psql.

create extension if not exists pgcrypto;

-- Patients table used by the mock and API repository layer.
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  date_of_birth date not null,
  sex text not null,
  phone text,
  email text,
  primary_doctor_id uuid references public.doctors(id),
  allergies text[],
  conditions text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_patients_full_name on public.patients (full_name);
create index if not exists idx_patients_primary_doctor_id on public.patients (primary_doctor_id);

-- Doctors table used by the mock and API repository layer.
create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  specialty text not null,
  clinic_name text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_doctors_full_name on public.doctors (full_name);

-- Appointments table used by the appointment APIs.
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  doctor_id uuid not null references public.doctors(id),You are a senior backend engineer working on MedBridge (Next.js 16 + Supabase + MCP + AI system).

Your task is to fully migrate the system from fallback/mock mode to a real Supabase-backed production system using MCP tools.

--------------------------------------------------
GOAL
--------------------------------------------------
- All data must be stored and retrieved from Supabase
- Fallback should ONLY be used when Supabase is unavailable
- Ensure schema, data, API routes, and MCP are fully aligned

--------------------------------------------------
STEP 1: APPLY DATABASE SCHEMA
--------------------------------------------------

Use MCP Supabase tool to execute SQL:

1. Read local file:
   supabase-schema.sql

2. Execute it in Supabase:
   - Create tables if NOT EXISTS:
     users
     patients
     doctors
     cases
     appointments
     doctor_notes (if present)

3. Ensure:
   - Primary keys (uuid)
   - Foreign keys
   - Indexes on:
     user_id, patient_id, doctor_id, created_at

4. Enable RLS:
   - But create DEV policy:
     allow all for now (authenticated = true)

--------------------------------------------------
STEP 2: VERIFY TABLES EXIST
--------------------------------------------------

Run checks:

SELECT to_regclass('public.patients');
SELECT to_regclass('public.doctors');
SELECT to_regclass('public.cases');
SELECT to_regclass('public.appointments');

If any NULL → recreate missing table

--------------------------------------------------
STEP 3: SEED INITIAL DATA (IMPORTANT)
--------------------------------------------------

Insert minimal working data:

- 1 doctor
- 1 patient
- 1 appointment
- 1 case

Ensure relationships:
- patient.user_id exists in users
- doctor.user_id exists in users

--------------------------------------------------
STEP 4: CONNECT REPOSITORY LAYER
--------------------------------------------------

Update repositories:

- If table exists → ALWAYS use Supabase
- Only fallback if:
  - Supabase env missing
  - OR query throws error

Add logs:
  "Using Supabase DB"
  "Fallback mode active"

--------------------------------------------------
STEP 5: FIX API ROUTES
--------------------------------------------------

Ensure these routes use real DB:

/api/patients
/api/doctors
/api/cases
/api/appointments

Rules:
- NEVER return empty success
- If no data → return []
- If DB error → return { ok: false, error }

--------------------------------------------------
STEP 6: MCP ROUTING (CRITICAL)
--------------------------------------------------

Fix /api/mcp:

- Detect intent:
  - "symptom" → AI
  - "doctor" → DB doctors
  - "appointment" → DB appointments
  - "case" → DB cases

- Always return:
{
  ok: true,
  source: "supabase" | "ai",
  data: ...
}

- NEVER return placeholder data

--------------------------------------------------
STEP 7: REMOVE FAKE FALLBACK DEPENDENCY
--------------------------------------------------

Reduce fallback usage:

- DO NOT default to demo data if DB is working
- Only fallback on hard failure

--------------------------------------------------
STEP 8: VALIDATE END-TO-END FLOW
--------------------------------------------------

Test:

1. Create case → saved in Supabase
2. Fetch cases → returned from DB
3. Fetch doctors → real data
4. Fetch patients → real data
5. Create appointment → persisted

--------------------------------------------------
STEP 9: FINAL OUTPUT
--------------------------------------------------

Return:

1. Tables created/verified
2. Seed data inserted
3. API routes confirmed working
4. MCP routing status
5. Any remaining issues
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null,
  reason text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_appointments_patient_id on public.appointments (patient_id);
create index if not exists idx_appointments_doctor_id on public.appointments (doctor_id);
create index if not exists idx_appointments_start_time on public.appointments (start_time desc);

-- Cases table used by the case service.
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  symptoms text not null,
  urgency text not null,
  red_flags jsonb not null default '[]'::jsonb,
  doctor_summary text not null,
  status text not null default 'pending',
  patient_name text,
  nearest_hospital jsonb,
  history jsonb not null default '[]'::jsonb,
  follow_ups jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cases_urgency_check check ((urgency = ANY (ARRAY['low'::text, 'medium'::text, 'urgent'::text]))),
  constraint cases_status_check check ((status = ANY (ARRAY['pending'::text, 'monitoring'::text, 'resolved'::text])))
);
create index if not exists idx_cases_user_id on public.cases (user_id);
create index if not exists idx_cases_created_at on public.cases (created_at desc);

-- Doctor notes table used by the MCP save_doctor_notes tool.
create table if not exists public.doctor_notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  doctor_id uuid not null references public.doctors(id),
  subjective text,
  bp text,
  heart_rate text,
  assessment text,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_doctor_notes_patient_id on public.doctor_notes (patient_id);
create index if not exists idx_doctor_notes_doctor_id on public.doctor_notes (doctor_id);

-- Clinical data tables referenced by the health profile API.
create table if not exists public.vitals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  recorded_at timestamptz not null,
  systolic integer,
  diastolic integer,
  heart_rate integer,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_vitals_patient_id on public.vitals (patient_id);
create index if not exists idx_vitals_recorded_at on public.vitals (recorded_at desc);

create table if not exists public.lab_results (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  recorded_at timestamptz not null,
  test_name text,
  result text,
  units text,
  normal_range text,
  created_at timestamptz not null default now()
);
create index if not exists idx_lab_results_patient_id on public.lab_results (patient_id);
create index if not exists idx_lab_results_recorded_at on public.lab_results (recorded_at desc);

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  name text,
  dosage text,
  frequency text,
  start_date date,
  end_date date,
  instructions text,
  created_at timestamptz not null default now()
);
create index if not exists idx_medications_patient_id on public.medications (patient_id);

create table if not exists public.allergies (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  substance text,
  reaction text,
  severity text,
  created_at timestamptz not null default now()
);
create index if not exists idx_allergies_patient_id on public.allergies (patient_id);

create table if not exists public.clinical_observations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  clinician_id uuid not null,
  observation text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_clinical_observations_patient_id on public.clinical_observations (patient_id);
create index if not exists idx_clinical_observations_clinician_id on public.clinical_observations (clinician_id);

-- Performance: support the app's basic lookup patterns.
create index if not exists idx_patients_email on public.patients (email);
create index if not exists idx_doctors_email on public.doctors (email);
create index if not exists idx_doctor_notes_created_at on public.doctor_notes (created_at desc);
