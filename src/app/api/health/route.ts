import { NextResponse } from "next/server";

import { hasSupabasePublicEnv, mapApiKey } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    ok: true,
    supabaseConfigured: hasSupabasePublicEnv,
    geoapifyConfigured: !!mapApiKey,
  });
}

