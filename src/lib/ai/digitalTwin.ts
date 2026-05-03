import type { ForecastResult } from '@/lib/ai/forecastEngine';
import type { PatientStateVector } from '@/lib/ai/patientStateVector';
import type { TrajectorySimulation } from '@/lib/ai/trajectorySimulator';

export type DigitalTwin = {
  patientId: string;
  stateVector: PatientStateVector;
  forecastModel: ForecastResult;
  simulationState: TrajectorySimulation;
  lastUpdated: number;
  version: number;
};

const twinCache = new Map<string, { twin: DigitalTwin; expiresAt: number }>();
const TTL_MS = 90_000;

export function getDigitalTwin(patientId: string) {
  const item = twinCache.get(patientId);
  if (!item || item.expiresAt < Date.now()) return null;
  return item.twin;
}

export function upsertDigitalTwin(next: Omit<DigitalTwin, 'version' | 'lastUpdated'>) {
  const current = getDigitalTwin(next.patientId);
  const twin: DigitalTwin = {
    ...next,
    version: (current?.version ?? 0) + 1,
    lastUpdated: Date.now(),
  };
  twinCache.set(next.patientId, { twin, expiresAt: Date.now() + TTL_MS });
  return twin;
}
