import { env } from '@/lib/env';
import { fetchNearbyHospitalsGeoapify } from '@/lib/geo/geoapify-nearby';
import { emitEvent } from '@/lib/server/events';
import { getRepositories, type RepositoryPrincipal } from '@/lib/server/repositories';
import type { MessageRecord } from '@/lib/types';

export type EmergencyTriggerPayload = {
  patientId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  symptoms: string[];
  aiSummary: string;
  location?: { lat: number; lng: number; address?: string };
  initiatedByUserId?: string;
  senderRole?: MessageRecord['role'];
  repoPrincipal: RepositoryPrincipal;
};

export type EmergencyTriggerResult = {
  patientId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  hospitalSuggestions?: Array<{
    name: string;
    address: string;
    lat: number;
    lng: number;
    distanceMeters: number;
    estimatedTime: string;
    priority_score: number;
    reason: string;
  }>;
  noteCreated?: boolean;
  appointmentEscalated?: boolean;
};

export async function triggerEmergencyForPatient(payload: EmergencyTriggerPayload): Promise<EmergencyTriggerResult> {
  // EMERGENCY FLOW:
  // API route -> emergency.ts trigger -> repositories writes/routing + optional geo lookup -> emitEvent("emergency:triggered").
  // This module intentionally contains no AI inference logic.
  const repos = getRepositories(payload.repoPrincipal);
  const patient = await repos.patients.getPatient(payload.patientId);
  if (!patient) {
    throw new Error('Patient not found');
  }

  const severity = payload.riskLevel === 'critical' ? 'critical' : 'high';
  await repos.timeline.createTimelineEvent({
    patientId: patient.id,
    eventType: 'emergency:triggered',
    title: 'Emergency escalation triggered',
    description: `AI summary: ${payload.aiSummary}. Symptoms: ${payload.symptoms.join('; ')}`,
    severity,
    source: 'system',
    metadata: {
      riskLevel: payload.riskLevel,
      symptoms: payload.symptoms,
      location: payload.location ?? null,
    },
  });

  let appointmentEscalated = false;
  try {
    await repos.appointments.escalatePatientAppointments(patient.id, 'emergency');
    appointmentEscalated = true;
  } catch {
    // best-effort escalation; continue
  }

  let hospitalSuggestions: EmergencyTriggerResult['hospitalSuggestions'] = undefined;
  if (payload.location && env.GEOAPIFY_API_KEY) {
    const nearby = await fetchNearbyHospitalsGeoapify({
      lat: payload.location.lat,
      lng: payload.location.lng,
      apiKey: env.GEOAPIFY_API_KEY,
      radiusM: 10000,
      limit: 6,
    });
    if (nearby.ok) {
      hospitalSuggestions = nearby.hospitals
        .filter((h) => h.kind === 'hospital')
        .map((h) => ({
          name: h.name,
          address: h.address,
          lat: h.lat,
          lng: h.lng,
          distanceMeters: Math.round(Math.hypot(payload.location!.lat - h.lat, payload.location!.lng - h.lng) * 111000),
          estimatedTime: 'Dispatch estimate only',
          priority_score: 100,
          reason: 'Emergency routing recommendation',
        }))
        .slice(0, 3);
    }
  }

  if (patient.primaryDoctorId) {
    try {
      const doctor = await repos.doctors.getDoctor(patient.primaryDoctorId);
      if (doctor) {
        const senderId = payload.initiatedByUserId ?? patient.id;
        await repos.messages.createMessage({
          senderId,
          receiverId: doctor.id,
          role: (payload.senderRole === 'ai' ? 'system' : payload.senderRole) ?? 'system',
          message: `Emergency escalation for ${patient.fullName}: ${payload.aiSummary}. Symptoms: ${payload.symptoms.join(', ')}. Risk level: ${payload.riskLevel}.`,
          attachments: {
            location: payload.location ?? null,
            riskLevel: payload.riskLevel,
          },
        });
      }
    } catch {
      // ignore message failures
    }
  }

  emitEvent('emergency:triggered', {
    patientId: patient.id,
    riskLevel: payload.riskLevel,
    appointmentEscalated,
    hospitalSuggestions: hospitalSuggestions?.map((h) => ({ name: h.name, address: h.address })),
  });

  return {
    patientId: patient.id,
    riskLevel: payload.riskLevel,
    hospitalSuggestions,
    noteCreated: true,
    appointmentEscalated,
  };
}
