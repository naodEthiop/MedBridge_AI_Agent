import { eventBus } from '@/lib/server/events';
import { toInternalObservation } from '@/lib/fhir/fhirAdapter';

export function ingestExternalLabResult(resource: unknown) {
  const lab = toInternalObservation(resource);
  eventBus.emit('lab:result_received', { patientId: lab.patientId, labId: lab.id, timestamp: new Date().toISOString() });
  return lab;
}

export function updateExternalLabResult(resource: unknown) {
  const lab = toInternalObservation(resource);
  eventBus.emit('lab:result_updated', { patientId: lab.patientId, labId: lab.id, timestamp: new Date().toISOString() });
  return lab;
}
