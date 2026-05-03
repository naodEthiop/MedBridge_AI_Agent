import { analyzeClinicalState, calculateRiskTrajectory } from '@/lib/ai/clinicalReasoner';
import type { PatientMemory } from '@/lib/ai/patientMemory';

export function getEarlyWarning(memory: PatientMemory) {
  const state = analyzeClinicalState(memory);
  const trajectory = calculateRiskTrajectory(memory);
  if (state.riskLevel === 'critical' || trajectory === 'critical escalation likely') {
    return {
      patientId: memory.patientId,
      riskLevel: state.riskLevel,
      reason: trajectory === 'critical escalation likely' ? 'Critical trajectory pattern detected' : 'Critical clinical risk pattern detected',
      timestamp: new Date().toISOString(),
    };
  }
  return null;
}
