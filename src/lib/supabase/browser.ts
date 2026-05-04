"use client";

import { getSupabaseBrowserClient as getClient } from "@/lib/db/supabaseClient";

export function getSupabaseBrowserClient() {
  return getClient();
}
