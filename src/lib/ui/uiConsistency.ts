/**
 * Client-side realtime consistency: ignore stale payloads and dedupe deliveries.
 * Server remains authoritative for tenant boundaries — UI never filters tenants.
 */

export function extractEventTimestampMs(payload: Record<string, unknown>): number {
  const raw =
    (typeof payload.timestamp === "string" && payload.timestamp) ||
    (typeof payload.createdAt === "string" && payload.createdAt) ||
    (typeof payload.issuedAt === "string" && payload.issuedAt) ||
    null;
  if (raw) {
    const t = new Date(raw).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return Date.now();
}

export function shouldApplyByMonotonicClock(
  lastAppliedMs: number | null,
  payload: Record<string, unknown>,
  eventName: string,
): boolean {
  const ts = extractEventTimestampMs(payload);
  if (lastAppliedMs != null && ts < lastAppliedMs) {
    return false;
  }
  void eventName;
  return true;
}

/** Stable fingerprint for deduplicating the same broadcast arriving twice. */
export function fingerprintClientEvent(event: string, payload: Record<string, unknown>): string {
  const ts = extractEventTimestampMs(payload);
  const id =
    (typeof payload.id === "string" && payload.id) ||
    (typeof payload.clientMessageId === "string" && payload.clientMessageId) ||
    (typeof payload.appointmentId === "string" && payload.appointmentId) ||
    (typeof payload.patientId === "string" && payload.patientId) ||
    (typeof payload.threadId === "string" && payload.threadId) ||
    "global";
  return `${event}:${id}:${Math.floor(ts / 1000)}`;
}

export type RingSet = {
  add: (key: string) => boolean;
  clear: () => void;
};

export function createRingFingerprintSet(maxKeys: number): RingSet {
  const order: string[] = [];
  const set = new Set<string>();
  return {
    add(key: string) {
      if (set.has(key)) return false;
      set.add(key);
      order.push(key);
      while (order.length > maxKeys) {
        const evict = order.shift();
        if (evict) set.delete(evict);
      }
      return true;
    },
    clear() {
      set.clear();
      order.length = 0;
    },
  };
}
