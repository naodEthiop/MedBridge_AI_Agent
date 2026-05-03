import { createClient } from "@supabase/supabase-js";
import { env, hasSupabasePublicEnv } from "@/lib/env";

if (!hasSupabasePublicEnv) {
  console.warn("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

// Ensure ONLY ONE Supabase client exists across the project as requested.
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL || "http://mock-url.invalid",
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
