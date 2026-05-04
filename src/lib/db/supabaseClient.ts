/**
 * Single module for `@supabase/supabase-js` `createClient` (anon + service).
 * Import from here or from `@/lib/supabase/server` re-exports — do not call `createClient` elsewhere.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env, hasSupabasePublicEnv } from "@/lib/env";

const serverAnonAuth = { persistSession: false, autoRefreshToken: false } as const;

export function createServerAnonSupabaseClient(accessToken?: string): SupabaseClient {
  if (!hasSupabasePublicEnv) {
    throw new Error("Sign-in service is not configured.");
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: serverAnonAuth,
    ...(accessToken
      ? {
          global: {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        }
      : {}),
  });
}

/** Service-role client for server-only admin operations. Returns null if not configured. */
export function createServiceSupabaseClient(): SupabaseClient | null {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let browserClient: SupabaseClient | null = null;

export function getBrowserAnonSupabaseClient(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("Browser auth client is only available in the browser.");
  }
  if (!hasSupabasePublicEnv) {
    throw new Error("Sign-in service is not configured.");
  }
  if (!browserClient) {
    browserClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
}
