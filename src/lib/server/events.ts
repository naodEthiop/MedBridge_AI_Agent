export type SystemEventName =
  | 'patient:risk_updated'
  | 'emergency:triggered'
  | 'appointment:created'
  | 'ai:analysis_completed'
  | 'doctor:note_added';

export function emitEvent(name: SystemEventName, payload: Record<string, unknown>) {
  console.log(`[event] ${name}`, JSON.stringify(payload, null, 2));
}
