export type ModelProvider = 'openai' | 'cloudflare' | 'hybrid';

export function getModelRegistry() {
  return {
    openai: { version: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini' },
    cloudflare: { version: process.env.CLOUDFLARE_AI_MODEL?.trim() || 'cf-default' },
    fallbackChain: ['openai', 'cloudflare'] as const,
  };
}
