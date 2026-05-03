type CacheEntry<T> = { value: T; expiresAt: number };
const edgeCache = new Map<string, CacheEntry<unknown>>();

function keyOf(tenantId: string, patientId: string, kind: string) {
  return `${tenantId}:${patientId}:${kind}`;
}

export function getEdgeCached<T>(tenantId: string, patientId: string, kind: string): T | null {
  const key = keyOf(tenantId, patientId, kind);
  const found = edgeCache.get(key);
  if (!found || found.expiresAt < Date.now()) return null;
  return found.value as T;
}

export function setEdgeCached<T>(tenantId: string, patientId: string, kind: string, value: T, ttlMs = 90_000) {
  edgeCache.set(keyOf(tenantId, patientId, kind), { value, expiresAt: Date.now() + ttlMs });
}
