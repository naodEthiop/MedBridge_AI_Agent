export function isStaleUpdate(currentTimestamp: string | null | undefined, incomingTimestamp: string | null | undefined) {
  if (!incomingTimestamp) return true;
  if (!currentTimestamp) return false;
  return new Date(incomingTimestamp).getTime() < new Date(currentTimestamp).getTime();
}

export function shouldApplyStateUpdate<T extends { updatedAt?: string | null; createdAt?: string | null }>(
  current: T | null | undefined,
  incoming: T,
) {
  const currentTs = current?.updatedAt ?? current?.createdAt ?? null;
  const incomingTs = incoming.updatedAt ?? incoming.createdAt ?? null;
  return !isStaleUpdate(currentTs, incomingTs);
}
