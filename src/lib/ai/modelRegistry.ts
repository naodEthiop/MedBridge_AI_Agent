export type ModelProvider = 'gemini' | 'cloudflare' | 'hybrid';

export function getModelRegistry() {
  return {
    gemini: { version: process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash' },
    cloudflare: { version: process.env.CLOUDFLARE_AI_MODEL?.trim() || 'cf-default' },
    fallbackChain: ['gemini', 'cloudflare'] as const,
  };
}
