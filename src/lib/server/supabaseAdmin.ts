import { createSupabaseAdminClient } from "@/lib/supabase/server";

export function getSupabaseAdmin() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error(
      "Supabase admin is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return supabase;
}

