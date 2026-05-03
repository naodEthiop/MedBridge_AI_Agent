export type Region = 'africa-east' | 'europe-west' | 'global-fallback';

export function resolveRegion(latencyHints: Partial<Record<Region, number>>): Region {
  const entries = Object.entries(latencyHints) as Array<[Region, number]>;
  if (!entries.length) return 'global-fallback';
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0][0];
}

export function getFallbackRegion(region: Region): Region {
  if (region === 'africa-east') return 'europe-west';
  return 'global-fallback';
}
