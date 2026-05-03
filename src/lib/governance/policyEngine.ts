export type AccessRole = 'patient' | 'doctor' | 'admin';

export function canAccessAiOutput(args: { role: AccessRole; ownerPatientId: string; requesterId: string; emergencyOverride?: boolean }) {
  if (args.role === 'admin') return true;
  if (args.role === 'doctor') return true;
  if (args.role === 'patient' && args.ownerPatientId === args.requesterId) return true;
  return Boolean(args.emergencyOverride);
}
