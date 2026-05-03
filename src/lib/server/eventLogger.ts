export function logEventDebug(input: {
  eventName: string;
  fingerprint: string;
  affectedQueries: string[];
  durationMs: number;
  skipped: boolean;
}) {
  if (process.env.NODE_ENV === 'production') return;
  console.log('[event:debug]', JSON.stringify(input));
}
