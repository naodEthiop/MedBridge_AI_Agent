export function normalizeAiResponse(args: {
  data: Record<string, unknown>;
  model: string;
  explanation: Record<string, unknown>;
  confidence: number;
  riskLevel: string;
  memoryVersion?: string;
}) {
  return {
    success: true,
    data: args.data,
    metadata: {
      model: args.model,
      timestamp: Date.now(),
      memoryVersion: args.memoryVersion ?? 'v1',
    },
    explanation: args.explanation,
    confidence: args.confidence,
    risk: args.riskLevel,
  };
}
