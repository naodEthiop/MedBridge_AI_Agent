import { getSupabaseServerClient } from "@/lib/db/supabaseServer";

export async function getSupabaseAdmin() {
  return await getSupabaseServerClient();
}

