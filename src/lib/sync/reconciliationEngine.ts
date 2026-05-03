export function reconcileByTimestamp<T extends { updatedAt?: string; createdAt?: string }>(internalRow: T, externalRow: T) {
  const i = new Date(internalRow.updatedAt ?? internalRow.createdAt ?? 0).getTime();
  const e = new Date(externalRow.updatedAt ?? externalRow.createdAt ?? 0).getTime();
  return e >= i ? externalRow : internalRow;
}

export function preventAiOverride(externalAuthoritative: boolean, aiSuggestion: unknown, externalRecord: unknown) {
  return externalAuthoritative ? externalRecord : aiSuggestion;
}
