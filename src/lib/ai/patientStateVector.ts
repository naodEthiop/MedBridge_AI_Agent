import type { PatientMemory } from '@/lib/ai/patientMemory';

export type PatientStateVector = {
  vitals: {
    bloodPressureTrend: number;
    heartRateVariability: number;
    temperatureStability: number;
  };
  labs: {
    glucoseTrend: number;
    cholesterolTrend: number;
    inflammationMarkers: number;
  };
  symptoms: {
    frequencyScore: number;
    severityTrend: number;
  };
  riskBaseline: number;
  stabilityIndex: number;
};

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function buildPatientStateVector(memory: PatientMemory): PatientStateVector {
  const recent = memory.timeline.slice(-30);
  const severities = recent.map((e) => e.severity ?? 1);
  const symptomEvents = recent.filter((e) => e.type === 'symptom' || e.type === 'ai_analysis');
  const labEvents = recent.filter((e) => e.type === 'lab');

  const severityAvg = avg(severities);
  const severityTrend = avg(severities.slice(Math.floor(severities.length / 2))) - avg(severities.slice(0, Math.floor(severities.length / 2)));

  return {
    vitals: {
      bloodPressureTrend: Number((severityTrend * 0.8).toFixed(3)),
      heartRateVariability: Number((Math.max(0, 1 - severityAvg / 5)).toFixed(3)),
      temperatureStability: Number((Math.max(0, 1 - Math.abs(severityTrend))).toFixed(3)),
    },
    labs: {
      glucoseTrend: Number((labEvents.length * 0.08).toFixed(3)),
      cholesterolTrend: Number((labEvents.length * 0.05).toFixed(3)),
      inflammationMarkers: Number((avg(labEvents.map((e) => e.severity ?? 1)) / 4).toFixed(3)),
    },
    symptoms: {
      frequencyScore: Number((symptomEvents.length / Math.max(1, recent.length)).toFixed(3)),
      severityTrend: Number(severityTrend.toFixed(3)),
    },
    riskBaseline: Number((Math.min(1, severityAvg / 4)).toFixed(3)),
    stabilityIndex: Number((Math.max(0, 1 - Math.abs(severityTrend) - symptomEvents.length / 100)).toFixed(3)),
  };
}
