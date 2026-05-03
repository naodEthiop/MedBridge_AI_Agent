// src/lib/server/repositories.ts
// MCP-Migrated Repository Layer
// ALL database operations now go through MCP gateway

import { createDBGateway } from "@/lib/db/dbGateway";

// Default tenant context for server-side operations
const DEFAULT_TENANT_CONTEXT = {
  tenantId: process.env.DEFAULT_TENANT_ID || 'medbridge-tenant-001',
  userId: 'system-user',
  role: 'admin' as const
};

function getDBGateway() {
  return createDBGateway(DEFAULT_TENANT_CONTEXT);
}

// Type definitions
export interface Patient {
  id: string;
  userId: string;
  fullName: string;
  sex: 'male' | 'female' | 'other';
  dob: string;
  dateOfBirth?: string; // Alias for dob
  medicalHistory: Record<string, unknown>;
  primaryDoctorId?: string;
  conditions?: string[];
  allergies?: string[];
  phone?: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  userId: string;
  fullName: string;
  specialization: string;
  specialty?: string; // Alias for specialization
  clinicName?: string;
  licenseNumber?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  urgency?: 'low' | 'medium' | 'high' | 'emergency';
  reason?: string;
  location?: string;
}

export interface MedicalTimelineEvent {
  id: string;
  patientId: string;
  eventType: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: 'ai' | 'doctor' | 'patient' | 'system';
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface MessageRecord {
  id: string;
  senderId: string;
  receiverId: string;
  role: 'patient' | 'doctor' | 'system';
  message: string;
  attachments: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface LabRecord {
  id: string;
  patientId: string;
  testName: string;
  result: string;
  normalRange?: string;
  createdAt: string;
}

// Mapping functions
function mapPatient(row: Record<string, unknown>): Patient {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    fullName: String(row.full_name),
    sex: String(row.gender) as Patient['sex'],
    dob: String(row.dob),
    dateOfBirth: String(row.dob), // Alias for compatibility
    medicalHistory: (row.medical_history as Record<string, unknown>) ?? {},
    primaryDoctorId: row.primary_doctor_id ? String(row.primary_doctor_id) : undefined,
    conditions: (row.conditions as string[]) ?? [],
    allergies: (row.allergies as string[]) ?? [],
    phone: row.phone ? String(row.phone) : undefined,
    createdAt: String(row.created_at),
  };
}

function mapDoctor(row: Record<string, unknown>): Doctor {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    fullName: String(row.full_name),
    specialization: String(row.specialization),
    specialty: String(row.specialization), // Alias for compatibility
    clinicName: row.clinic_name ? String(row.clinic_name) : undefined,
    licenseNumber: row.license_number ? String(row.license_number) : undefined,
    createdAt: String(row.created_at),
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
  const dbGateway = getDBGateway();

  return {
    patients: {
      async listPatients() {
        const data = await dbGateway.query('patients', {
          orderBy: 'full_name ASC'
        });
        return data.map((row: any) => mapPatient(row));
      },
      async getPatient(id) {
        // MCP query with OR condition - simplified for now
        const data = await dbGateway.query('patients', {
          where: `id = '${id}' OR user_id = '${id}'`,
          limit: 1
        });
        return data.length > 0 ? mapPatient(data[0]) : null;
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
        const data = await dbGateway.insert('patients', payload);
        return mapPatient(data);
      },
    },
    doctors: {
      async listDoctors() {
        const data = await dbGateway.query('doctors', {
          orderBy: 'full_name ASC'
        });
        return data.map((row: any) => mapDoctor(row));
      },
      async getDoctor(id) {
        const data = await dbGateway.query('doctors', {
          where: `id = '${id}' OR user_id = '${id}'`,
          limit: 1
        });
        return data.length > 0 ? mapDoctor(data[0]) : null;
      },
      async createDoctor(params) {
        const payload = {
          id: params.userId,
          user_id: params.userId,
          full_name: params.fullName,
          specialization: params.specialization,
          license_number: params.licenseNumber ?? null,
        };
        const data = await dbGateway.insert('doctors', payload);
        return mapDoctor(data);
      },
    },
    appointments: {
      async listAppointments() {
        const data = await dbGateway.query('appointments', {
          orderBy: 'scheduled_at DESC'
        });
        return data.map((row: any) => mapAppointment(row));
      },
      async listAppointmentsForPatient(patientId) {
        const data = await dbGateway.query('appointments', {
          where: `patient_id = '${patientId}'`,
          orderBy: 'scheduled_at DESC'
        });
        return data.map((row: any) => mapAppointment(row));
      },
      async listAppointmentsForDoctor(doctorId) {
        const data = await dbGateway.query('appointments', {
          where: `doctor_id = '${doctorId}'`,
          orderBy: 'scheduled_at DESC'
        });
        return data.map((row: any) => mapAppointment(row));
      },
      async createAppointment(params) {
        const payload = {
          patient_id: params.patientId,
          doctor_id: params.doctorId,
          health_center_id: params.healthCenterId,
          scheduled_at: params.scheduledAt,
          status: params.status,
          urgency: params.urgency ?? 'medium',
          reason: params.reason ?? null,
          location: params.location ?? null,
        };
        const data = await dbGateway.insert('appointments', payload);
        return mapAppointment(data);
      },
      async escalatePatientAppointments(patientId, urgency) {
        // MCP update - need to get appointments first and update each one
        const appointments = await dbGateway.query('appointments', {
          where: `patient_id = '${patientId}' AND status = 'scheduled'`
        });

        for (const appointment of appointments) {
          await dbGateway.update('appointments', appointment.id, { urgency });
        }
      },
    },
    users: {
      async getUserById(id) {
        const data = await dbGateway.query('users', {
          where: `id = '${id}'`,
          limit: 1
        });
        if (data.length === 0) return null;
        const row = data[0];
        return {
          id: String(row.id),
          email: String(row.email),
          role: row.role === 'doctor' ? 'doctor' : 'patient',
        };
      },
    },
    healthCenters: {
      async saveHealthCenter(params) {
        // MCP upsert - simplified for now, using insert
        const payload = {
          name: params.name,
          type: params.type,
          lat: params.lat,
          lng: params.lng,
          address: params.address,
        };
        const data = await dbGateway.insert('health_centers', payload);
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
        const data = await dbGateway.query('medical_timeline', {
          where: `patient_id = '${patientId}'`,
          orderBy: 'created_at DESC'
        });
        return data.map((row: any) => mapTimelineEvent(row));
      },
      async listTimelineForDoctor(doctorId) {
        // First get patients for this doctor
        const patients = await dbGateway.query('patients', {
          where: `primary_doctor_id = '${doctorId}'`
        });
        const patientIds = patients.map((p: any) => p.id);
        if (patientIds.length === 0) return [];

        const data = await dbGateway.query('medical_timeline', {
          where: `patient_id IN (${patientIds.map(id => `'${id}'`).join(',')})`,
          orderBy: 'created_at DESC'
        });
        return data.map((row: any) => mapTimelineEvent(row));
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
        const data = await dbGateway.insert('medical_timeline', payload);
        return mapTimelineEvent(data);
      },
    },
    messages: {
      async listConversation(userAId, userBId) {
        const data = await dbGateway.query('messages', {
          where: `(sender_id = '${userAId}' AND receiver_id = '${userBId}') OR (sender_id = '${userBId}' AND receiver_id = '${userAId}')`,
          orderBy: 'created_at ASC'
        });
        return data.map((row: any) => mapMessage(row));
      },
      async createMessage(params) {
        const payload = {
          sender_id: params.senderId,
          receiver_id: params.receiverId,
          role: params.role,
          message: params.message,
          attachments: params.attachments ?? {},
        };
        const data = await dbGateway.insert('messages', payload);
        return mapMessage(data);
      },
    },
    labs: {
      async listLabsForPatient(patientId) {
        const data = await dbGateway.query('labs', {
          where: `patient_id = '${patientId}'`,
          orderBy: 'created_at DESC'
        });
        return data.map((row: any) => mapLab(row));
      },
      async createLab(params) {
        const payload = {
          patient_id: params.patientId,
          test_name: params.testName,
          result: params.result,
          normal_range: params.normalRange ?? null,
        };
        const data = await dbGateway.insert('labs', payload);
        return mapLab(data);
      },
    },
  };
}