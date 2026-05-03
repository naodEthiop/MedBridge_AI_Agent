import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createSessionCookie, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session-core";
import type { SessionUser } from "@/lib/auth/types";
import { env, hasSupabasePublicEnv } from "@/lib/env";
import { supabase } from "@/lib/db/supabaseClient";

/**
 * Bridges Supabase OAuth (or any Supabase session) into the app's httpOnly role cookie
 * so existing middleware and demo routes keep working.
 */
export async function POST(request: Request) {
  if (!hasSupabasePublicEnv) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Missing access token." }, { status: 401 });
  }

  // Inject token dynamically for this single request check
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.email) {
    return NextResponse.json({ error: "Invalid or expired Supabase session." }, { status: 401 });
  }

  const meta = data.user.user_metadata as Record<string, unknown> | undefined;
  const rawRole = meta?.role;
  const role: SessionUser["role"] = rawRole === "doctor" ? "doctor" : "patient";

  const user: SessionUser = {
    email: data.user.email.toLowerCase(),
    role,
  };

  const sealed = await createSessionCookie(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sealed, sessionCookieOptions());

  return NextResponse.json({ ok: true, user });
}
