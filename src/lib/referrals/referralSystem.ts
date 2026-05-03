import { eventBus } from '@/lib/server/events';

export function createReferral(payload: Record<string, unknown>) {
  const referralId = `ref_${Date.now()}`;
  eventBus.emit('referral:created', { referralId, timestamp: new Date().toISOString() });
  return { referralId, ...payload };
}

export function acceptReferral(referralId: string) {
  eventBus.emit('referral:accepted', { referralId, timestamp: new Date().toISOString() });
  return { referralId, status: 'accepted' };
}

export function completeReferral(referralId: string) {
  eventBus.emit('referral:completed', { referralId, timestamp: new Date().toISOString() });
  return { referralId, status: 'completed' };
}
