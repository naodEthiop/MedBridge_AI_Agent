export type RegionalRiskTrend = { region: string; avgRisk: number; sampleSize: number };
export type CohortPattern = { cohort: string; signal: string; prevalence: number };

export function buildFederatedInsights(input: {
  region: string;
  riskScores: number[];
  cohortSignals: Array<{ cohort: string; signal: string }>;
}) {
  const avgRisk = input.riskScores.length ? input.riskScores.reduce((a, b) => a + b, 0) / input.riskScores.length : 0;
  const trends: RegionalRiskTrend[] = [{ region: input.region, avgRisk: Number(avgRisk.toFixed(2)), sampleSize: input.riskScores.length }];
  const map = new Map<string, number>();
  for (const entry of input.cohortSignals) map.set(`${entry.cohort}:${entry.signal}`, (map.get(`${entry.cohort}:${entry.signal}`) ?? 0) + 1);
  const patterns: CohortPattern[] = [...map.entries()].map(([k, count]) => {
    const [cohort, signal] = k.split(':');
    return { cohort, signal, prevalence: Number((count / Math.max(1, input.cohortSignals.length)).toFixed(3)) };
  });
  return { trends, patterns };
}
