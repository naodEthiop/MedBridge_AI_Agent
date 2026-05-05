import { NextResponse } from "next/server";

import { env, mapApiKey, hasSupabasePublicEnv } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    ok: true,
    system: "medbridge",
    services: {
      supabase: hasSupabasePublicEnv,
      geoapify: Boolean(mapApiKey),
      openai: Boolean(process.env.OPENAI_API_KEY),
    },
  });
}
