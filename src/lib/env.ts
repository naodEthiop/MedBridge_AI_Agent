import { z } from "zod";

const envSchema = z.object({
  AUTH_SESSION_SECRET: z.string().optional(),
  /** Required for client/server absolute API URLs (throws via `requirePublicApiBaseUrl` when used). */
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_BACKEND_API_BASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  GEOAPIFY_API_KEY: z.string().optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_AI_GATEWAY_BASE_URL: z.string().optional(),
  CLOUDFLARE_AI_GATEWAY_TOKEN: z.string().optional(),
  CLOUDFLARE_AI_ENABLED: z.string().optional(),
  CLOUDFLARE_AI_MODEL: z.string().optional(),
  CLOUDFLARE_AI_CONFIDENCE_THRESHOLD: z.string().optional(),
  CLOUDFLARE_AI_DAILY_LIMIT: z.string().optional(),
  CLOUDFLARE_AI_TIMEOUT_MS: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_TRANSCRIPTION_MODEL: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

const parsedEnv = envSchema.parse({
  AUTH_SESSION_SECRET: process.env.AUTH_SESSION_SECRET,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_BACKEND_API_BASE_URL: process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  GEOAPIFY_API_KEY: process.env.GEOAPIFY_API_KEY,
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_AI_GATEWAY_BASE_URL: process.env.CLOUDFLARE_AI_GATEWAY_BASE_URL,
  CLOUDFLARE_AI_GATEWAY_TOKEN: process.env.CLOUDFLARE_AI_GATEWAY_TOKEN,
  CLOUDFLARE_AI_ENABLED: process.env.CLOUDFLARE_AI_ENABLED,
  CLOUDFLARE_AI_MODEL: process.env.CLOUDFLARE_AI_MODEL,
  CLOUDFLARE_AI_CONFIDENCE_THRESHOLD: process.env.CLOUDFLARE_AI_CONFIDENCE_THRESHOLD,
  CLOUDFLARE_AI_DAILY_LIMIT: process.env.CLOUDFLARE_AI_DAILY_LIMIT,
  CLOUDFLARE_AI_TIMEOUT_MS: process.env.CLOUDFLARE_AI_TIMEOUT_MS,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_TRANSCRIPTION_MODEL: process.env.OPENAI_TRANSCRIPTION_MODEL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

export const env = {
  ...parsedEnv,
  NEXT_PUBLIC_API_URL:
    parsedEnv.NEXT_PUBLIC_API_URL?.trim() ||
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : undefined),
};

export const hasSupabasePublicEnv =
  !!env.NEXT_PUBLIC_SUPABASE_URL && !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getBackendBaseUrl() {
  return env.NEXT_PUBLIC_BACKEND_API_BASE_URL?.trim() || "";
}

/**
 * Public origin for API calls. Required in production paths that build absolute fetch URLs.
 */
export function requirePublicApiBaseUrl(): string {
  const raw = env.NEXT_PUBLIC_API_URL?.trim();
  if (raw) {
    return raw.replace(/\/$/, "");
  }
  // Fallback for development only
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  throw new Error("NEXT_PUBLIC_API_URL is not configured.");
}

export const API_URL = requirePublicApiBaseUrl();

export const publicEnv = {
  NEXT_PUBLIC_API_URL: API_URL,
  NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

/**
 * Safe fetch wrapper that prevents uncaught promise errors
 */
export async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

