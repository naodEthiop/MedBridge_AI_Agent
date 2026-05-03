const WINDOW_MS = 5_000;

export function getEventFingerprint(eventName: string, payload: Record<string, unknown>) {
  const entityId =
    (typeof payload.patientId === 'string' && payload.patientId) ||
    (typeof payload.userId === 'string' && payload.userId) ||
    (typeof payload.doctorId === 'string' && payload.doctorId) ||
    (typeof payload.id === 'string' && payload.id) ||
    'global';

  const rawTs = typeof payload.timestamp === 'string' ? new Date(payload.timestamp).getTime() : Date.now();
  const timestampBucket = Math.floor(rawTs / WINDOW_MS);
  return `${eventName}:${entityId}:${timestampBucket}`;
}

export const EVENT_FINGERPRINT_TTL_MS = 10_000;
