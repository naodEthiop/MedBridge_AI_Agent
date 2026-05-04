"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getBrowserAnonSupabaseClient } from "@/lib/db/supabaseClient";

export function getSupabaseBrowserClient(): SupabaseClient {
  return getBrowserAnonSupabaseClient();
}
