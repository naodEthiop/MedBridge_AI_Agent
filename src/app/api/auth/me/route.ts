import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { env, hasSupabasePublicEnv } from "@/lib/env";

export async function GET(req: Request) {
  if (!hasSupabasePublicEnv) {
    return NextResponse.json(
      {
        authenticated: false,
        error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ authenticated: false }, { status: 401 });

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ authenticated: false }, { status: 401 });

  return NextResponse.json({
    authenticated: true,
    mode: "supabase",
    user: {
      id: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata?.role ?? "patient",
    },
  });
}

