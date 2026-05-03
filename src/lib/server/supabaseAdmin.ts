import { supabase } from "@/lib/db/supabaseClient";

export function getSupabaseAdmin() {
  return supabase;
}

