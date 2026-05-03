import { eventBus } from '@/lib/server/events';

const buckets = new Map<string, { count: number; resetAt: number }>();

export function enforceRateLimit(key: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  if (bucket.count >= limit) {
    eventBus.emit('security:rate_limit_hit', { key, limit, timestamp: new Date().toISOString() });
    return { allowed: false };
  }
  bucket.count += 1;
  if (bucket.count > limit * 0.8) {
    eventBus.emit('security:throttle_applied', { key, count: bucket.count, timestamp: new Date().toISOString() });
  }
  return { allowed: true };
}
