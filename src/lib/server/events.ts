import { getEventFingerprint, EVENT_FINGERPRINT_TTL_MS } from '@/lib/server/eventFingerprint';
import { logEventDebug } from '@/lib/server/eventLogger';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export type SystemEventName =
  | 'patient:risk_updated'
  | 'emergency:triggered'
  | 'appointment:created'
  | 'ai:analysis_completed'
  | 'doctor:note_added'
  | 'ai:memory_updated'
  | 'ai:clinical_analysis_completed'
  | 'ai:risk_trajectory_updated'
  | 'ai:digital_twin_updated'
  | 'ai:forecast_updated'
  | 'ai:simulation_updated'
  | 'ai:trajectory_risk_detected'
  | 'ai:intervention_recommendation'
  | 'ai:early_warning_escalation'
  | 'ai:request_logged'
  | 'ai:request_failed'
  | 'ai:request_completed'
  | 'ai:metrics_updated'
  | 'ai:safety_escalation'
  | 'ai:system_health_ok'
  | 'ai:degraded_mode_active'
  | 'ai:fallback_triggered'
  | 'ai:cost_threshold_warning'
  | 'sync:queued'
  | 'sync:completed'
  | 'sync:conflict_resolved'
  | 'security:rate_limit_hit'
  | 'security:throttle_applied'
  | 'system:health_ok'
  | 'system:degraded'
  | 'system:critical_load';

const recentlyEmitted = new Map<string, number>();

function cleanupFingerprints(now = Date.now()) {
  for (const [fingerprint, expiry] of recentlyEmitted.entries()) {
    if (expiry <= now) recentlyEmitted.delete(fingerprint);
  }
}

async function broadcastRealtime(name: SystemEventName, payload: Record<string, unknown>) {
  const tenantId = typeof payload.tenantId === 'string' ? payload.tenantId : null;
  const eventName = tenantId ? `${tenantId}:${name}` : name;
  const supabase = getSupabaseAdmin();
  await supabase.channel('realtime:global').send({
    type: 'broadcast',
    event: eventName,
    payload,
  });

  if (name === 'emergency:triggered' || (name === 'patient:risk_updated' && payload.riskLevel === 'critical')) {
    await supabase.channel('realtime:critical').send({
      type: 'broadcast',
      event: name,
      payload,
    });
  }
}

export function emitEvent(name: SystemEventName, payload: Record<string, unknown>) {
  const startedAt = Date.now();
  cleanupFingerprints(startedAt);
  const fingerprint = getEventFingerprint(name, payload);
  if (recentlyEmitted.has(fingerprint)) {
    logEventDebug({ eventName: name, fingerprint, affectedQueries: [], durationMs: Date.now() - startedAt, skipped: true });
    return;
  }

  recentlyEmitted.set(fingerprint, startedAt + EVENT_FINGERPRINT_TTL_MS);
  console.log(`[event] ${name}`, JSON.stringify(payload, null, 2));
  void broadcastRealtime(name, payload)
    .then(() => {
      logEventDebug({ eventName: name, fingerprint, affectedQueries: [], durationMs: Date.now() - startedAt, skipped: false });
    })
    .catch((error) => {
      console.error('[event] realtime broadcast failed', error);
    });
}

export const eventBus = {
  emit: emitEvent,
};
