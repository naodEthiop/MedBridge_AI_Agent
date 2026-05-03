export function exportAuditAsJson(rows: Array<Record<string, unknown>>) {
  return JSON.stringify(rows, null, 2);
}

export function exportAuditAsCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const body = rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')).join('\n');
  return `${headers.join(',')}\n${body}`;
}
