-- Supabase schema for MedBridge production backend
-- Run this in your Supabase project's SQL editor or with psql.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('patient', 'doctor')),
  created_at timestamptz not null default now()
);
create index if not exists idx_users_role on public.users (role);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  full_name text not null,
  gender text not null check (gender in ('female', 'male', 'other')),
  dob date not null,
  phone text,
  email text,
  primary_doctor_id uuid references public.doctors(id),
  allergies text[],
  conditions text[],
  medical_history jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_patients_user_id on public.patients (user_id);
create index if not exists idx_patients_full_name on public.patients (full_name);
create index if not exists idx_patients_primary_doctor_id on public.patients (primary_doctor_id);

create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  full_name text not null,
  specialization text not null,
  clinic_name text,
  phone text,
  email text,
  license_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_doctors_user_id on public.doctors (user_id);
create index if not exists idx_doctors_full_name on public.doctors (full_name);
create index if not exists idx_doctors_specialization on public.doctors (specialization);
create index if not exists idx_doctors_clinic_name on public.doctors (clinic_name);

create table if not exists public.health_centers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('hospital', 'clinic', 'pharmacy')),
  lat numeric not null,
  lng numeric not null,
  address text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_health_centers_name_location on public.health_centers (name, lat, lng);
create index if not exists idx_health_centers_type on public.health_centers (type);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  health_center_id uuid not null references public.health_centers(id) on delete restrict,
  scheduled_at timestamptz not null,
  status text not null check (status in ('scheduled', 'completed', 'cancelled')),
  reason text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_appointments_patient_id on public.appointments (patient_id);
create index if not exists idx_appointments_doctor_id on public.appointments (doctor_id);
create index if not exists idx_appointments_health_center_id on public.appointments (health_center_id);
create index if not exists idx_appointments_scheduled_at on public.appointments (scheduled_at);

create table if not exists public.medical_reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  report_text text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_medical_reports_patient_id on public.medical_reports (patient_id);
create index if not exists idx_medical_reports_doctor_id on public.medical_reports (doctor_id);

create table if not exists public.labs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  test_name text not null,
  result text not null,
  normal_range text,
  created_at timestamptz not null default now()
);
create index if not exists idx_labs_patient_id on public.labs (patient_id);
create index if not exists idx_labs_test_name on public.labs (test_name);

create table if not exists public.chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('patient', 'doctor')),
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_chat_history_user_id on public.chat_history (user_id);
create index if not exists idx_chat_history_created_at on public.chat_history (created_at);

create table if not exists public.medical_timeline (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  event_type text not null,
  title text not null,
  description text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  source text not null check (source in ('ai', 'doctor', 'system', 'lab')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_medical_timeline_patient_id on public.medical_timeline (patient_id);
create index if not exists idx_medical_timeline_created_at on public.medical_timeline (created_at);
create index if not exists idx_medical_timeline_event_type on public.medical_timeline (event_type);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('patient', 'doctor', 'ai')),
  message text not null,
  attachments jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_sender_id on public.messages (sender_id);
create index if not exists idx_messages_receiver_id on public.messages (receiver_id);
create index if not exists idx_messages_created_at on public.messages (created_at);
create index if not exists idx_messages_read on public.messages (read);

alter table public.appointments add column if not exists urgency text not null default 'medium' check (urgency in ('low', 'medium', 'high', 'emergency'));

-- Phase 3.6 realtime replication enablement
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_history;
ALTER PUBLICATION supabase_realtime ADD TABLE medical_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE labs;
