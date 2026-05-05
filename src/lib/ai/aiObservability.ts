import { eventBus } from '@/lib/server/events';
import { recordAiMetric } from '@/lib/ai/aiMetrics';

export async function trackAiRequest<T>(args: {
  patientId?: string;
  endpoint: string;
  model: 'openai' | 'cloudflare' | 'hybrid';
  run: () => Promise<T>;
}) {
  const started = Date.now();
  eventBus.emit('ai:request_logged', { patientId: args.patientId ?? null, endpoint: args.endpoint, model: args.model, timestamp: new Date(started).toISOString() });
  try {
    const result = await args.run();
    const latency = Date.now() - started;
    recordAiMetric(args.model, latency, true);
    eventBus.emit('ai:request_completed', { patientId: args.patientId ?? null, endpoint: args.endpoint, model: args.model, latencyMs: latency, timestamp: new Date().toISOString() });
    eventBus.emit('ai:metrics_updated', { model: args.model, latencyMs: latency, timestamp: new Date().toISOString() });
    return result;
  } catch (error) {
    const latency = Date.now() - started;
    recordAiMetric(args.model, latency, false);
    eventBus.emit('ai:request_failed', { patientId: args.patientId ?? null, endpoint: args.endpoint, model: args.model, latencyMs: latency, error: error instanceof Error ? error.message : 'unknown', timestamp: new Date().toISOString() });
    throw error;
  }
}
