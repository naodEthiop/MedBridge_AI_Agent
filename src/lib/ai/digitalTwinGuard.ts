const updateLock = new Map<string, number>();

export function canApplyTwinUpdate(patientId: string, timestamp: number) {
  const previous = updateLock.get(patientId) ?? 0;
  if (timestamp < previous) return false;
  updateLock.set(patientId, timestamp);
  return true;
}
