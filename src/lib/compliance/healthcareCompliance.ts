import { appendAuditTrail } from '@/lib/ai/auditTrail';
import { redactObject } from '@/lib/ai/privacyFilter';

export function assertConsent(consent: boolean) {
  if (!consent) throw new Error('Patient consent required for external data transfer');
}

export async function auditExternalSync(args: { patientId?: string; payload: unknown; action: string; consent: boolean }) {
  assertConsent(args.consent);
  await appendAuditTrail({
    patientId: args.patientId,
    input: redactObject({ action: args.action }),
    output: redactObject(args.payload),
    reasoningSummary: `external_sync:${args.action}`,
    modelVersion: 'external-adapter-v1',
  });
}
