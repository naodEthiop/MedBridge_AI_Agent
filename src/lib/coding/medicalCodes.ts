const ICD_MAP: Record<string, string> = { hypertension: 'I10', diabetes: 'E11.9' };
const CPT_MAP: Record<string, string> = { consultation: '99213', telehealth: '99441' };
const LOINC_MAP: Record<string, string> = { glucose: '2345-7', cholesterol: '2093-3' };

export function mapConditionToIcd(condition: string) { return ICD_MAP[condition.toLowerCase()] ?? 'R69'; }
export function mapProcedureToCpt(procedure: string) { return CPT_MAP[procedure.toLowerCase()] ?? '99499'; }
export function mapLabToLoinc(lab: string) { return LOINC_MAP[lab.toLowerCase()] ?? '0000-0'; }
