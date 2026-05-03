export function normalizeExternalHealthData(input: {
  patientId: string;
  timelineEvents?: Array<Record<string, unknown>>;
  labs?: Array<Record<string, unknown>>;
  diagnoses?: Array<Record<string, unknown>>;
  medications?: Array<Record<string, unknown>>;
  procedures?: Array<Record<string, unknown>>;
}) {
  return {
    patientId: input.patientId,
    timelineEvents: input.timelineEvents ?? [],
    labs: input.labs ?? [],
    diagnoses: input.diagnoses ?? [],
    medications: input.medications ?? [],
    procedures: input.procedures ?? [],
  };
}
