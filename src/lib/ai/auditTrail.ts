import crypto from 'crypto';

const auditStore: Array<Record<string, unknown>> = [];

export function hashSnapshot(input: unknown) {
  return crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
}

export async function appendAuditTrail(entry: {
  patientId?: string;
  input: unknown;
  output: unknown;
  reasoningSummary: string;
  modelVersion: string;
}) {
  auditStore.push({
    inputHash: hashSnapshot(entry.input),
    outputHash: hashSnapshot(entry.output),
    patientId: entry.patientId ?? null,
    reasoningSummary: entry.reasoningSummary,
    modelVersion: entry.modelVersion,
    timestamp: new Date().toISOString(),
  });
  return auditStore[auditStore.length - 1];
}
