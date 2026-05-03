export function buildClinicalAnalytics(input: { tenantId: string; risks: number[]; outcomes: Array<{ predicted: number; observed: number }> }) {
  const avgRisk = input.risks.length ? input.risks.reduce((a, b) => a + b, 0) / input.risks.length : 0;
  const accuracy = input.outcomes.length
    ? 1 - input.outcomes.reduce((sum, row) => sum + Math.abs(row.predicted - row.observed), 0) / (input.outcomes.length * 100)
    : 0;
  return {
    tenantId: input.tenantId,
    hospitalRiskTrend: Number(avgRisk.toFixed(2)),
    diseasePrevalenceSignals: Number((input.risks.filter((v) => v > 70).length / Math.max(1, input.risks.length)).toFixed(3)),
    aiPredictionAccuracy: Number(Math.max(0, Math.min(1, accuracy)).toFixed(3)),
  };
}
