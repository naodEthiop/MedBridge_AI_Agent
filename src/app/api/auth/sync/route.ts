import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createSessionCookie, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session-core";
import type { SessionUser } from "@/lib/auth/types";
import { getSupabaseServerClient } from "@/lib/db/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/env";

/**
 * Bridges Supabase OAuth (or any Supabase session) into the app's httpOnly role cookie
 * so existing middleware and demo routes keep working.
 */
export async function POST(request: Request) {
  if (!hasSupabasePublicEnv) {
    return NextResponse.json({ error: "Sign-in service is not configured." }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  
  const supabase = await getSupabaseServerClient();

  const { data, error } = token 
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();
  if (error || !data.user?.email) {
    return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  let dbRole: "doctor" | "patient" | null = null;
  if (admin) {
    const { data: dbUser } = await admin
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    dbRole = dbUser?.role as "doctor" | "patient" | null;
  }

  const role: SessionUser["role"] = dbRole ?? "patient";

  const user: SessionUser = {
    id: data.user.id,
    email: data.user.email.toLowerCase(),
    role,
  };

  const sealed = await createSessionCookie(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sealed, sessionCookieOptions());

  return NextResponse.json({ ok: true, user });
}
