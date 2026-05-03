import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export type SystemEventName =
  | 'patient:risk_updated'
  | 'emergency:triggered'
  | 'appointment:created'
  | 'ai:analysis_completed'
  | 'doctor:note_added';

async function broadcastRealtime(name: SystemEventName, payload: Record<string, unknown>) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.channel('realtime:global').send({
      type: 'broadcast',
      event: name,
      payload,
    });

    if (name === 'emergency:triggered' || (name === 'patient:risk_updated' && payload.riskLevel === 'critical')) {
      await supabase.channel('realtime:critical').send({
        type: 'broadcast',
        event: name,
        payload,
      });
    }
  } catch (error) {
    console.error('[event] realtime broadcast failed', error);
  }
}

export function emitEvent(name: SystemEventName, payload: Record<string, unknown>) {
  console.log(`[event] ${name}`, JSON.stringify(payload, null, 2));
  void broadcastRealtime(name, payload);
}

export const eventBus = {
  emit: emitEvent,
};
