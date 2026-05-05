import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/db/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/env";

export async function GET(request: Request) {
  if (!hasSupabasePublicEnv) {
    return NextResponse.json({ error: "Auth service not configured." }, { status: 503 });
  }

  const supabase = await getSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = authData.user.id;
  const admin = createSupabaseAdminClient();

  if (!admin) {
    // Fallback: return minimal user info from auth session
    return NextResponse.json({
      ok: true,
      user: {
        userId,
        email: authData.user.email ?? null,
        role: null,
        fullName: authData.user.user_metadata?.full_name ?? authData.user.user_metadata?.name ?? null,
        onboardingComplete: false,
      },
    });
  }

  // Fetch from public.users — single source of truth
  const { data: dbUser, error: dbError } = await admin
    .from("users")
    .select("id, email, role, full_name, onboarding_complete")
    .eq("id", userId)
    .maybeSingle();

  if (dbError) {
    console.error("[user/me] DB lookup failed:", dbError);
    return NextResponse.json({ ok: false, error: "Failed to load user data." }, { status: 500 });
  }

  if (!dbUser) {
    // User authenticated but not yet in public.users (edge case)
    return NextResponse.json({
      ok: true,
      user: {
        userId,
        email: authData.user.email ?? null,
        role: null,
        fullName: authData.user.user_metadata?.full_name ?? authData.user.user_metadata?.name ?? null,
        onboardingComplete: false,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    user: {
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role ?? null,
      fullName: dbUser.full_name ?? null,
      onboardingComplete: Boolean(dbUser.onboarding_complete),
    },
  });
}
