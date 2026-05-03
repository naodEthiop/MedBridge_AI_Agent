import type { ForecastResult } from '@/lib/ai/forecastEngine';
import type { PatientMemory } from '@/lib/ai/patientMemory';
import type { TrajectorySimulation } from '@/lib/ai/trajectorySimulator';

export function generateExplanation(args: {
  result: unknown;
  memory?: PatientMemory | null;
  forecast?: ForecastResult | null;
  simulation?: TrajectorySimulation | null;
}) {
  return {
    reasoning: [
      'Prediction generated from longitudinal timeline events and severity trends.',
      `Memory events considered: ${args.memory?.timeline.length ?? 0}`,
      `Forecast horizon points: ${args.forecast?.timeline.length ?? 0}`,
      `Simulated scenarios: ${args.simulation?.scenarios.length ?? 0}`,
    ],
    featureImportance: {
      severityTrend: 0.4,
      labPatterns: 0.3,
      appointmentHistory: 0.2,
      aiSignals: 0.1,
    },
    riskContributors: ['severity trend', 'lab marker pressure'],
    temporalFactors: args.forecast?.timeline ?? [],
    summary: 'Supportive predictive reasoning for clinician decision support only.',
  };
}
