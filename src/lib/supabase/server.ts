import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env, hasSupabasePublicEnv } from "@/lib/env";

const baseClientOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
} as const;

const tableExistenceCache = new Map<string, boolean>();

export function createSupabaseServerClient(accessToken?: string): SupabaseClient {
  if (!hasSupabasePublicEnv) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    ...baseClientOptions,
    ...(accessToken
      ? {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        }
      : {}),
  });
}

export async function doesSupabaseTableExist(tableName: string): Promise<boolean> {
  if (!hasSupabasePublicEnv) return false;
  if (tableExistenceCache.has(tableName)) {
    return tableExistenceCache.get(tableName)!;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from(tableName).select("id").limit(1).maybeSingle();
    const exists = !error;
    tableExistenceCache.set(tableName, exists);
    return exists;
  } catch {
    tableExistenceCache.set(tableName, false);
    return false;
  }
}

export function createSupabaseAdminClient() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}
