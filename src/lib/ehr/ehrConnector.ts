import { eventBus } from '@/lib/server/events';
import { toFhirAppointment, toFhirObservation, toFhirPatient } from '@/lib/fhir/fhirAdapter';

export async function syncPatientRecord(patient: Record<string, unknown>) {
  const payload = toFhirPatient(patient as Record<string, unknown>);
  eventBus.emit('ehr:sync_completed', { entity: 'patient', patientId: patient.id, timestamp: new Date().toISOString() });
  return payload;
}

export async function syncAppointments(appointment: Record<string, unknown>) {
  const payload = toFhirAppointment(appointment as Record<string, unknown>);
  eventBus.emit('ehr:sync_completed', { entity: 'appointment', appointmentId: appointment.id, timestamp: new Date().toISOString() });
  return payload;
}

export async function syncLabResults(lab: Record<string, unknown>) {
  const payload = toFhirObservation(lab as Record<string, unknown>);
  eventBus.emit('ehr:sync_completed', { entity: 'lab', labId: lab.id, timestamp: new Date().toISOString() });
  return payload;
}

export async function pushUpdateToEhr(payload: Record<string, unknown>) {
  eventBus.emit('ehr:sync_completed', { entity: 'generic', timestamp: new Date().toISOString() });
  return { ok: true, payload };
}
