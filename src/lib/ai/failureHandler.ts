import { eventBus } from '@/lib/server/events';

export async function withFailureRecovery<T>(fn: () => Promise<T>, context: { patientId?: string; fallback?: () => Promise<T> }) {
  let attempt = 0;
  while (attempt < 2) {
    try {
      return await fn();
    } catch (error) {
      attempt += 1;
      if (attempt >= 2) {
        if (context.fallback) {
          eventBus.emit('ai:fallback_triggered', { patientId: context.patientId ?? null, timestamp: new Date().toISOString() });
          return context.fallback();
        }
        eventBus.emit('ai:degraded_mode_active', { patientId: context.patientId ?? null, timestamp: new Date().toISOString() });
        throw error;
      }
      await new Promise((r) => setTimeout(r, 100 * 2 ** attempt));
    }
  }
  throw new Error('unreachable');
}
