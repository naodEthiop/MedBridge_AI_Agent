import { z } from "zod";

const envSchema = z.object({
  AUTH_SESSION_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_BACKEND_API_BASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  GEOAPIFY_API_KEY: z.string().optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_AI_GATEWAY_BASE_URL: z.string().optional(),
  CLOUDFLARE_AI_GATEWAY_TOKEN: z.string().optional(),
  CLOUDFLARE_AI_ENABLED: z.string().optional(),
  CLOUDFLARE_AI_MODEL: z.string().optional(),
});

export const env = envSchema.parse({
  AUTH_SESSION_SECRET: process.env.AUTH_SESSION_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_BACKEND_API_BASE_URL: process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  GEOAPIFY_API_KEY: process.env.GEOAPIFY_API_KEY,
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_AI_GATEWAY_BASE_URL: process.env.CLOUDFLARE_AI_GATEWAY_BASE_URL,
  CLOUDFLARE_AI_GATEWAY_TOKEN: process.env.CLOUDFLARE_AI_GATEWAY_TOKEN,
  CLOUDFLARE_AI_ENABLED: process.env.CLOUDFLARE_AI_ENABLED,
  CLOUDFLARE_AI_MODEL: process.env.CLOUDFLARE_AI_MODEL,
});

export const hasSupabasePublicEnv =
  !!env.NEXT_PUBLIC_SUPABASE_URL && !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getBackendBaseUrl() {
  return env.NEXT_PUBLIC_BACKEND_API_BASE_URL?.trim() || "";
}

