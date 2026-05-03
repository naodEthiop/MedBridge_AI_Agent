import type { SupabaseClient } from '@supabase/supabase-js';

import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { hasSupabasePublicEnv } from '@/lib/env';
import type { Appointment, Doctor, LabRecord, MedicalTimelineEvent, MessageRecord, Patient } from '@/lib/types';

function getSupabaseClient(): SupabaseClient {
  if (!hasSupabasePublicEnv) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return createSupabaseServerClient();
}

function getSupabaseAdminClientOrThrow(): SupabaseClient {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error('Supabase admin client is not configured. Set SUPABASE_SERVICE_ROLE_KEY.');
  }
  return admin;
}

function mapPatient(row: Record<string, unknown>): Patient {
  return {
    id: String(row.id),
    fullName: String(row.full_name),
    dateOfBirth: String(row.dob),
    sex: (String(row.gender) as Patient['sex']) ?? 'other',
    phone: row.phone ? String(row.phone) : undefined,
    email: row.email ? String(row.email) : undefined,
    primaryDoctorId: row.primary_doctor_id ? String(row.primary_doctor_id) : undefined,
    allergies: Array.isArray(row.allergies) ? (row.allergies as string[]) : undefined,
    conditions: Array.isArray(row.conditions) ? (row.conditions as string[]) : undefined,
  };
}

function mapDoctor(row: Record<string, unknown>): Doctor {
  return {
    id: String(row.id),
    fullName: String(row.full_name),
    specialty: String(row.specialization),
    clinicName: row.clinic_name ? String(row.clinic_name) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
    email: row.email ? String(row.email) : undefined,
  };
}

function mapAppointment(row: Record<string, unknown>): Appointment {
  return {
    id: String(row.id),
    patientId: String(row.patient_id),
    doctorId: String(row.doctor_id),
    startTime: String(row.scheduled_at),
    endTime: row.end_time ? String(row.end_time) : String(row.scheduled_at),
    status: String(row.status) as Appointment['status'],
    urgency: row.urgency ? (String(row.urgency) as Appointment['urgency']) : undefined,
    reason: row.reason ? String(row.reason) : undefined,
    location: row.location ? String(row.location) : undefined,
  };
}

function mapTimelineEvent(row: Record<string, unknown>): MedicalTimelineEvent {
  return {
    id: String(row.id),
    patientId: String(row.patient_id),
    eventType: String(row.event_type),
    title: String(row.title),
    description: String(row.description),
    severity: String(row.severity) as MedicalTimelineEvent['severity'],
    source: String(row.source) as MedicalTimelineEvent['source'],
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
  };
}

function mapMessage(row: Record<string, unknown>): MessageRecord {
  return {
    id: String(row.id),
    senderId: String(row.sender_id),
    receiverId: String(row.receiver_id),
    role: String(row.role) as MessageRecord['role'],
    message: String(row.message),
    attachments: (row.attachments as Record<string, unknown>) ?? {},
    read: Boolean(row.read),
    createdAt: String(row.created_at),
  };
}

function mapLab(row: Record<string, unknown>): LabRecord {
  return {
    id: String(row.id),
    patientId: String(row.patient_id),
    testName: String(row.test_name),
    result: String(row.result),
    normalRange: row.normal_range ? String(row.normal_range) : undefined,
    createdAt: String(row.created_at),
  };
}

export type Repositories = {
  patients: {
    listPatients(): Promise<Patient[]>;
    getPatient(id: string): Promise<Patient | null>;
    createPatient(params: {
      userId: string;
      fullName: string;
      gender: Patient['sex'];
      dob: string;
      medicalHistory?: Record<string, unknown>;
    }): Promise<Patient>;
  };
  doctors: {
    listDoctors(): Promise<Doctor[]>;
    getDoctor(id: string): Promise<Doctor | null>;
    createDoctor(params: {
      userId: string;
      fullName: string;
      specialization: string;
      licenseNumber?: string;
    }): Promise<Doctor>;
  };
  users: {
    getUserById(id: string): Promise<{ id: string; email: string; role: 'patient' | 'doctor' } | null>;
  };
  healthCenters: {
    saveHealthCenter(params: {
      name: string;
      type: 'hospital' | 'clinic' | 'pharmacy';
      lat: number;
      lng: number;
      address: string;
    }): Promise<{ id: string; name: string; type: string; lat: number; lng: number; address: string }>;
  };
  timeline: {
    listTimelineForPatient(patientId: string): Promise<MedicalTimelineEvent[]>;
    listTimelineForDoctor(doctorId: string): Promise<MedicalTimelineEvent[]>;
    createTimelineEvent(params: {
      patientId: string;
      eventType: string;
      title: string;
      description: string;
      severity: MedicalTimelineEvent['severity'];
      source: MedicalTimelineEvent['source'];
      metadata?: Record<string, unknown>;
    }): Promise<MedicalTimelineEvent>;
  };
  messages: {
    listConversation(userAId: string, userBId: string): Promise<MessageRecord[]>;
    createMessage(params: {
      senderId: string;
      receiverId: string;
      role: MessageRecord['role'];
      message: string;
      attachments?: Record<string, unknown>;
    }): Promise<MessageRecord>;
  };
  labs: {
    listLabsForPatient(patientId: string): Promise<LabRecord[]>;
    createLab(params: {
      patientId: string;
      testName: string;
      result: string;
      normalRange?: string;
    }): Promise<LabRecord>;
  };
  appointments: {
    listAppointments(): Promise<Appointment[]>;
    listAppointmentsForPatient(patientId: string): Promise<Appointment[]>;
    listAppointmentsForDoctor(doctorId: string): Promise<Appointment[]>;
    createAppointment(params: {
      patientId: string;
      doctorId: string;
      healthCenterId: string;
      scheduledAt: string;
      status: Appointment['status'];
      urgency?: Appointment['urgency'];
      reason?: string;
      location?: string;
    }): Promise<Appointment>;
    escalatePatientAppointments(patientId: string, urgency: Appointment['urgency']): Promise<void>;
  };
};

export function getRepositories(): Repositories {
  const supabase = getSupabaseClient();
  const admin = createSupabaseAdminClient() ?? supabase;

  return {
    patients: {
      async listPatients() {
        const { data, error } = await supabase.from('patients').select('*').order('full_name', { ascending: true });
        if (error) throw new Error(error.message);
        return (data ?? []).map((row) => mapPatient(row as Record<string, unknown>));
      },
      async getPatient(id) {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .or(`id.eq.${id},user_id.eq.${id}`)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data ? mapPatient(data as Record<string, unknown>) : null;
      },
      async createPatient(params) {
        const payload = {
          id: params.userId,
          user_id: params.userId,
          full_name: params.fullName,
          gender: params.gender,
          dob: params.dob,
          medical_history: params.medicalHistory ?? {},
        };
        const { data, error } = await admin.from('patients').insert(payload).select('*').maybeSingle();
        if (error || !data) throw new Error(error?.message ?? 'Failed to create patient');
        return mapPatient(data as Record<string, unknown>);
      },
    },
    doctors: {
      async listDoctors() {
        const { data, error } = await supabase.from('doctors').select('*').order('full_name', { ascending: true });
        if (error) throw new Error(error.message);
        return (data ?? []).map((row) => mapDoctor(row as Record<string, unknown>));
      },
      async getDoctor(id) {
        const { data, error } = await supabase
          .from('doctors')
          .select('*')
          .or(`id.eq.${id},user_id.eq.${id}`)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data ? mapDoctor(data as Record<string, unknown>) : null;
      },
      async createDoctor(params) {
        const payload = {
          id: params.userId,
          user_id: params.userId,
          full_name: params.fullName,
          specialization: params.specialization,
          license_number: params.licenseNumber ?? null,
        };
        const { data, error } = await admin.from('doctors').insert(payload).select('*').maybeSingle();
        if (error || !data) throw new Error(error?.message ?? 'Failed to create doctor');
        return mapDoctor(data as Record<string, unknown>);
      },
    },
    appointments: {
      async listAppointments() {
        const { data, error } = await supabase.from('appointments').select('*').order('scheduled_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []).map((row) => mapAppointment(row as Record<string, unknown>));
      },
      async listAppointmentsForPatient(patientId) {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', patientId)
          .order('scheduled_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []).map((row) => mapAppointment(row as Record<string, unknown>));
      },
      async listAppointmentsForDoctor(doctorId) {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('doctor_id', doctorId)
          .order('scheduled_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []).map((row) => mapAppointment(row as Record<string, unknown>));
      },
      async createAppointment(params) {
        const { data, error } = await admin
          .from('appointments')
          .insert({
            patient_id: params.patientId,
            doctor_id: params.doctorId,
            health_center_id: params.healthCenterId,
            scheduled_at: params.scheduledAt,
            status: params.status,
            reason: params.reason ?? null,
            location: params.location ?? null,
          })
          .select('*')
          .maybeSingle();
        if (error || !data) throw new Error(error?.message ?? 'Failed to create appointment');
        return mapAppointment(data as Record<string, unknown>);
      },
    },
    users: {
      async getUserById(id) {
        const { data, error } = await supabase.from('users').select('id, email, role').eq('id', id).maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) return null;
        return {
          id: String(data.id),
          email: String(data.email),
          role: data.role === 'doctor' ? 'doctor' : 'patient',
        };
      },
    },
    healthCenters: {
      async saveHealthCenter(params) {
        const { data, error } = await admin
          .from('health_centers')
          .upsert(
            {
              name: params.name,
              type: params.type,
              lat: params.lat,
              lng: params.lng,
              address: params.address,
            },
            { onConflict: ['name', 'lat', 'lng'] },
          )
          .select('*')
          .maybeSingle();
        if (error || !data) throw new Error(error?.message ?? 'Failed to save health center');
        return {
          id: String(data.id),
          name: String(data.name),
          type: String(data.type),
          lat: Number(data.lat),
          lng: Number(data.lng),
          address: String(data.address),
        };
      },
    },
    timeline: {
      async listTimelineForPatient(patientId) {
        const { data, error } = await supabase
          .from('medical_timeline')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []).map((row) => mapTimelineEvent(row as Record<string, unknown>));
      },
      async listTimelineForDoctor(doctorId) {
        const { data: patients, error: patientError } = await supabase
          .from('patients')
          .select('id')
          .eq('primary_doctor_id', doctorId);
        if (patientError) throw new Error(patientError.message);
        const patientIds = (patients ?? []).map((row) => String((row as Record<string, unknown>).id));
        if (!patientIds.length) return [];
        const { data, error } = await supabase
          .from('medical_timeline')
          .select('*')
          .in('patient_id', patientIds)
          .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []).map((row) => mapTimelineEvent(row as Record<string, unknown>));
      },
      async createTimelineEvent(params) {
        const payload = {
          patient_id: params.patientId,
          event_type: params.eventType,
          title: params.title,
          description: params.description,
          severity: params.severity,
          source: params.source,
          metadata: params.metadata ?? {},
        };
        const { data, error } = await admin
          .from('medical_timeline')
          .insert(payload)
          .select('*')
          .maybeSingle();
        if (error || !data) throw new Error(error?.message ?? 'Failed to create timeline event');
        return mapTimelineEvent(data as Record<string, unknown>);
      },
    },
    messages: {
      async listConversation(userAId, userBId) {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(
            `and(sender_id.eq.${userAId},receiver_id.eq.${userBId}),and(sender_id.eq.${userBId},receiver_id.eq.${userAId})`,
          )
          .order('created_at', { ascending: true });
        if (error) throw new Error(error.message);
        return (data ?? []).map((row) => mapMessage(row as Record<string, unknown>));
      },
      async createMessage(params) {
        const { data, error } = await admin
          .from('messages')
          .insert({
            sender_id: params.senderId,
            receiver_id: params.receiverId,
            role: params.role,
            message: params.message,
            attachments: params.attachments ?? {},
          })
          .select('*')
          .maybeSingle();
        if (error || !data) throw new Error(error?.message ?? 'Failed to create message');
        return mapMessage(data as Record<string, unknown>);
      },
    },
    labs: {
      async listLabsForPatient(patientId) {
        const { data, error } = await supabase
          .from('labs')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []).map((row) => mapLab(row as Record<string, unknown>));
      },
      async createLab(params) {
        const { data, error } = await admin
          .from('labs')
          .insert({
            patient_id: params.patientId,
            test_name: params.testName,
            result: params.result,
            normal_range: params.normalRange ?? null,
          })
          .select('*')
          .maybeSingle();
        if (error || !data) throw new Error(error?.message ?? 'Failed to create lab record');
        return mapLab(data as Record<string, unknown>);
      },
    },
    appointments: {
      async listAppointments() {
        const { data, error } = await supabase.from('appointments').select('*').order('scheduled_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []).map((row) => mapAppointment(row as Record<string, unknown>));
      },
      async listAppointmentsForPatient(patientId) {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', patientId)
          .order('scheduled_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []).map((row) => mapAppointment(row as Record<string, unknown>));
      },
      async listAppointmentsForDoctor(doctorId) {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('doctor_id', doctorId)
          .order('scheduled_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []).map((row) => mapAppointment(row as Record<string, unknown>));
      },
      async createAppointment(params) {
        const { data, error } = await admin
          .from('appointments')
          .insert({
            patient_id: params.patientId,
            doctor_id: params.doctorId,
            health_center_id: params.healthCenterId,
            scheduled_at: params.scheduledAt,
            status: params.status,
            urgency: params.urgency ?? 'medium',
            reason: params.reason ?? null,
            location: params.location ?? null,
          })
          .select('*')
          .maybeSingle();
        if (error || !data) throw new Error(error?.message ?? 'Failed to create appointment');
        return mapAppointment(data as Record<string, unknown>);
      },
      async escalatePatientAppointments(patientId, urgency) {
        const { error } = await admin
          .from('appointments')
          .update({ urgency })
          .eq('patient_id', patientId)
          .eq('status', 'scheduled');
        if (error) throw new Error(error.message);
      },
    },
  };
}
