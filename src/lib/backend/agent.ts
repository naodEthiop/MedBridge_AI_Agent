export function buildInitialAgentResponse(symptom: string) {
  return {
    stage: "follow_up",
    symptom,
    question: "When did this start, and has it become worse over time?",
    guidance: "Provide duration, severity, and any associated symptoms.",
  };
}

export function buildFinalAgentResponse(symptom: string, followUpAnswer: string) {
  const text = `${symptom} ${followUpAnswer}`.toLowerCase();
  const highRiskKeywords = ["chest pain", "shortness of breath", "faint", "bleeding", "severe"];
  const risk = highRiskKeywords.some((k) => text.includes(k)) ? "high" : "medium";
  return {
    stage: "final",
    risk,
    summary: `Based on the reported symptom and follow-up detail, risk is assessed as ${risk}.`,
    recommendation:
      risk === "high"
        ? "Seek urgent medical care immediately."
        : "Arrange clinician follow-up and monitor symptom progression.",
  };
}

