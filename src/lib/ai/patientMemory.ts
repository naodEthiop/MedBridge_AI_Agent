import { getRepositories } from '@/lib/server/repositories';

export type MemoryEventType = 'symptom' | 'diagnosis' | 'lab' | 'ai_analysis' | 'appointment';

export type MemoryEvent = {
  type: MemoryEventType;
  timestamp: number;
  severity?: number;
  data: unknown;
};

export type PatientMemory = {
  patientId: string;
  timeline: MemoryEvent[];
};

function severityToScore(value: string | undefined) {
  if (!value) return undefined;
  if (value === 'critical' || value === 'urgent') return 4;
  if (value === 'high') return 3;
  if (value === 'medium') return 2;
  return 1;
}

export async function buildPatientMemory(patientId: string): Promise<PatientMemory> {
  const repos = getRepositories();
  const [timeline, labs, appointments] = await Promise.all([
    repos.timeline.listTimelineForPatient(patientId),
    repos.labs.listLabsForPatient(patientId),
    repos.appointments.listAppointmentsForPatient(patientId),
  ]);

  const timelineEvents: MemoryEvent[] = timeline.map((event) => ({
    type: event.source === 'ai' ? 'ai_analysis' : event.eventType.includes('diagnosis') ? 'diagnosis' : 'symptom',
    timestamp: new Date(event.createdAt).getTime(),
    severity: severityToScore(event.severity),
    data: event,
  }));

  const labEvents: MemoryEvent[] = labs.map((lab) => ({
    type: 'lab',
    timestamp: new Date(lab.createdAt).getTime(),
    data: lab,
  }));

  const appointmentEvents: MemoryEvent[] = appointments.map((appointment) => ({
    type: 'appointment',
    timestamp: new Date(appointment.startTime).getTime(),
    severity: severityToScore(appointment.urgency),
    data: appointment,
  }));

  const merged = [...timelineEvents, ...labEvents, ...appointmentEvents].sort((a, b) => a.timestamp - b.timestamp);
  return { patientId, timeline: merged };
}

export function summarizePatientMemory(memory: PatientMemory) {
  const recentEvents = memory.timeline.slice(-20);
  const riskSignals = recentEvents
    .filter((event) => (event.severity ?? 0) >= 3 || event.type === 'lab')
    .map((event) => `${event.type}@${new Date(event.timestamp).toISOString()}`);

  const trend = recentEvents
    .filter((event) => event.type === 'symptom' || event.type === 'ai_analysis')
    .map((event) => `${event.type}:${event.severity ?? 1}`)
    .join(' -> ');

  return { recentEvents, trend: trend || 'insufficient longitudinal symptom data', riskSignals };
}
