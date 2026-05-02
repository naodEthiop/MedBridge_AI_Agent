import { NextResponse } from "next/server";

import { env, hasSupabasePublicEnv } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    ok: true,
    supabaseConfigured: hasSupabasePublicEnv,
    geoapifyConfigured: !!env.GEOAPIFY_API_KEY,
  });
}
