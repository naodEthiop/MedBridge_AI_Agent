import type { SupabaseClient } from "@supabase/supabase-js";

import { hasSupabasePublicEnv } from "@/lib/env";
import { getSupabaseServerClient, createServiceSupabaseClient } from "@/lib/db/supabaseServer";

const tableExistenceCache = new Map<string, boolean>();

export async function createSupabaseServerClient(accessToken?: string): Promise<SupabaseClient> {
  return await getSupabaseServerClient();
}

export async function doesSupabaseTableExist(tableName: string): Promise<boolean> {
  if (!hasSupabasePublicEnv) return false;
  if (tableExistenceCache.has(tableName)) {
    return tableExistenceCache.get(tableName)!;
  }

  try {
    const supabase = await createSupabaseServerClient();
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
  return createServiceSupabaseClient();
}
