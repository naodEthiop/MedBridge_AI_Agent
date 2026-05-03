import { eventBus } from '@/lib/server/events';

export function enforceSafety(args: { patientId?: string; text: string; riskLevel: string }) {
  if (/\bdiagnosed with\b/i.test(args.text)) {
    throw new Error('Unsafe output: definitive diagnosis language detected');
  }
  if (args.riskLevel === 'critical') {
    eventBus.emit('ai:safety_escalation', { patientId: args.patientId ?? null, riskLevel: args.riskLevel, timestamp: new Date().toISOString() });
  }
}
