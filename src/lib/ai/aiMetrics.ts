const metrics = new Map<string, { calls: number; errors: number; latencyMs: number }>();

export function recordAiMetric(key: string, latencyMs: number, success: boolean) {
  const prev = metrics.get(key) ?? { calls: 0, errors: 0, latencyMs: 0 };
  metrics.set(key, {
    calls: prev.calls + 1,
    errors: prev.errors + (success ? 0 : 1),
    latencyMs: prev.latencyMs + latencyMs,
  });
}

export function getAiMetricSnapshot(key: string) {
  const m = metrics.get(key);
  if (!m) return { calls: 0, errors: 0, avgLatencyMs: 0 };
  return { calls: m.calls, errors: m.errors, avgLatencyMs: Number((m.latencyMs / Math.max(1, m.calls)).toFixed(2)) };
}
