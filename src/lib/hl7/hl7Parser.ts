export function parseHl7Message(message: string) {
  const segments = message.split(/\r?\n/).filter(Boolean);
  const msh = segments.find((s) => s.startsWith('MSH|')) ?? '';
  const type = msh.includes('|ADT') ? 'ADT' : msh.includes('|ORM') ? 'ORM' : 'ORU';
  const pid = segments.find((s) => s.startsWith('PID|'))?.split('|') ?? [];
  const patient = { id: pid[3] ?? '', name: pid[5] ?? '', dob: pid[7] ?? '', sex: pid[8] ?? '' };
  const observations = segments.filter((s) => s.startsWith('OBX|')).map((s) => {
    const c = s.split('|');
    return { code: c[3] ?? '', value: c[5] ?? '', unit: c[6] ?? '' };
  });
  const events = segments.filter((s) => s.startsWith('EVN|')).map((s) => ({ raw: s }));
  return { type: type as 'ADT' | 'ORM' | 'ORU', patient, observations, events };
}
