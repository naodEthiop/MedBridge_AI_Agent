import { eventBus } from '@/lib/server/events';

export function generateClaim(appointment: { id: string; patientId: string; reason?: string }) {
  const claim = { id: `claim_${appointment.id}`, appointmentId: appointment.id, patientId: appointment.patientId, code: '99213', reason: appointment.reason ?? 'general_consult' };
  eventBus.emit('billing:claim_created', { claimId: claim.id, patientId: appointment.patientId, timestamp: new Date().toISOString() });
  return claim;
}

export async function submitClaimToProvider(claim: { id: string }) {
  eventBus.emit('billing:claim_submitted', { claimId: claim.id, timestamp: new Date().toISOString() });
  return { claimId: claim.id, status: 'submitted' };
}

export async function trackClaimStatus(claimId: string) {
  const status = Math.random() > 0.5 ? 'paid' : 'denied';
  eventBus.emit(status === 'paid' ? 'billing:claim_paid' : 'billing:claim_denied', { claimId, timestamp: new Date().toISOString() });
  return { claimId, status };
}
