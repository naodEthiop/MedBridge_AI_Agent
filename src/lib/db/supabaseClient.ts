import { createBrowserClient } from '@supabase/ssr'
import { env } from "@/lib/env";

let client: any;

export function getSupabaseBrowserClient() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase public env is not configured.");
  }
  if (!client) {
    client = createBrowserClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return client
}
