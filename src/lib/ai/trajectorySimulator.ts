import type { ForecastResult } from '@/lib/ai/forecastEngine';

export type TrajectorySimulation = {
  scenarios: Array<{
    name: string;
    riskCurve: number[];
    outcomeProbability: number;
    interventionImpact: number;
  }>;
};

export function simulateTrajectories(forecast: ForecastResult): TrajectorySimulation {
  const base = forecast.timeline.map((p) => p.riskScore);
  const scenarios = [
    { name: 'no intervention', factor: 1.15 },
    { name: 'standard treatment', factor: 0.95 },
    { name: 'aggressive treatment', factor: 0.8 },
    { name: 'lifestyle improvement', factor: 0.85 },
  ].map((s) => {
    const riskCurve = base.map((value) => Number(Math.max(0, Math.min(100, value * s.factor)).toFixed(2)));
    return {
      name: s.name,
      riskCurve,
      outcomeProbability: Number((1 - riskCurve[riskCurve.length - 1] / 100).toFixed(3)),
      interventionImpact: Number((base[base.length - 1] - riskCurve[riskCurve.length - 1]).toFixed(2)),
    };
  });

  return { scenarios };
}
