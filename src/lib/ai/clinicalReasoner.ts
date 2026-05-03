import type { PatientMemory } from '@/lib/ai/patientMemory';

export type ClinicalState = {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  possibleConditions: string[];
  reasoning: string[];
  confidence: number;
};

export function analyzeClinicalState(memory: PatientMemory): ClinicalState {
  const recent = memory.timeline.slice(-20);
  const highSeverityCount = recent.filter((event) => (event.severity ?? 0) >= 3).length;
  const labCount = recent.filter((event) => event.type === 'lab').length;
  const aiCount = recent.filter((event) => event.type === 'ai_analysis').length;

  const riskLevel: ClinicalState['riskLevel'] = highSeverityCount >= 3 ? 'critical' : highSeverityCount >= 2 ? 'high' : highSeverityCount === 1 ? 'medium' : 'low';
  return {
    riskLevel,
    possibleConditions: ['Differential reasoning only; clinician review required'],
    reasoning: [
      `High-severity events in recent history: ${highSeverityCount}`,
      `Lab events considered: ${labCount}`,
      `AI analyses considered: ${aiCount}`,
      'This output provides decision support and is not a diagnosis.',
    ],
    confidence: Math.min(0.95, 0.4 + highSeverityCount * 0.1 + labCount * 0.05),
  };
}

export function calculateRiskTrajectory(memory: PatientMemory): 'improving' | 'stable' | 'worsening' | 'critical escalation likely' {
  const recent = memory.timeline.slice(-10);
  if (recent.length < 2) return 'stable';
  const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
  const secondHalf = recent.slice(Math.floor(recent.length / 2));
  const score = (arr: typeof recent) => arr.reduce((sum, event) => sum + (event.severity ?? 1), 0) / arr.length;
  const before = score(firstHalf);
  const after = score(secondHalf);
  if (after >= 3.5) return 'critical escalation likely';
  if (after - before > 0.5) return 'worsening';
  if (before - after > 0.5) return 'improving';
  return 'stable';
}
