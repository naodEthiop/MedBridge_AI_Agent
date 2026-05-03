import { eventBus } from '@/lib/server/events';
import { toInternalObservation } from '@/lib/fhir/fhirAdapter';

export function ingestExternalLabResult(resource: unknown) {
  if (typeof resource !== 'object' || resource === null) {
    throw new Error('Invalid lab result resource');
  }
  const lab = toInternalObservation(resource as Record<string, unknown>);
  eventBus.emit('lab:result_received', { patientId: lab.patientId, labId: lab.id, timestamp: new Date().toISOString() });
  return lab;
}

export function updateExternalLabResult(resource: unknown) {
  if (typeof resource !== 'object' || resource === null) {
    throw new Error('Invalid lab result resource');
  }
  const lab = toInternalObservation(resource as Record<string, unknown>);
  eventBus.emit('lab:result_updated', { patientId: lab.patientId, labId: lab.id, timestamp: new Date().toISOString() });
  return lab;
}
