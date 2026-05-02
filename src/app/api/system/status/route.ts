import { NextResponse } from "next/server";

import { env, hasSupabasePublicEnv } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    ok: true,
    system: "medbridge",
    services: {
      supabase: hasSupabasePublicEnv,
      geoapify: Boolean(env.GEOAPIFY_API_KEY),
      gemini: Boolean(env.GEMINI_API_KEY),
    },
  });
}
