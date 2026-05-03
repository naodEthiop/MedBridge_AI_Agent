import type { PatientStateVector } from '@/lib/ai/patientStateVector';

export type ForecastResult = {
  timeline: Array<{ day: 7 | 30 | 90 | 180; riskScore: number }>;
  slopeAnalysis: number;
  confidence: number;
  uncertaintyBounds: { upper: number; lower: number };
};

export function buildForecast(state: PatientStateVector): ForecastResult {
  const base = state.riskBaseline * 100;
  const slope = (state.symptoms.severityTrend + state.labs.inflammationMarkers - state.stabilityIndex * 0.2) * 10;
  const timeline = [7, 30, 90, 180].map((day) => ({
    day: day as 7 | 30 | 90 | 180,
    riskScore: Number(Math.max(0, Math.min(100, base + slope * Math.log1p(day / 7))).toFixed(2)),
  }));
  const confidence = Number(Math.max(0.4, Math.min(0.95, state.stabilityIndex + 0.3)).toFixed(3));
  return {
    timeline,
    slopeAnalysis: Number(slope.toFixed(3)),
    confidence,
    uncertaintyBounds: {
      upper: Number(Math.min(100, timeline[timeline.length - 1].riskScore + 12).toFixed(2)),
      lower: Number(Math.max(0, timeline[0].riskScore - 12).toFixed(2)),
    },
  };
}

export function buildRiskCurve(forecast: ForecastResult) {
  const riskCurve = forecast.timeline.map((point) => point.riskScore);
  const deltas = riskCurve.slice(1).map((value, index) => value - riskCurve[index]);
  const acceleration = deltas.length > 1 ? deltas[deltas.length - 1] - deltas[0] : 0;
  const inflectionPoints = deltas.map((delta, index) => (Math.abs(delta) > 5 ? index + 1 : -1)).filter((v) => v >= 0);
  return { riskCurve, acceleration: Number(acceleration.toFixed(3)), inflectionPoints };
}
