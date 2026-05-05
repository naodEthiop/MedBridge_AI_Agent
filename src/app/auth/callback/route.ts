import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/db/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

const SITE_URL = env.NEXT_PUBLIC_SITE_URL ?? "https://med-bridge-ai-agent.vercel.app";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_oauth_code", SITE_URL));
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError || !sessionData?.user) {
      console.error("[auth/callback] Code exchange failed:", sessionError);
      return NextResponse.redirect(new URL("/login?error=auth_callback_failed", SITE_URL));
    }

    const authUser = sessionData.user;
    const admin = createSupabaseAdminClient();

    if (!admin) {
      // No admin client — cannot check DB. Redirect to onboarding as safe default.
      console.error("[auth/callback] No admin client available (missing SUPABASE_SERVICE_ROLE_KEY).");
      return NextResponse.redirect(new URL("/onboarding/role-selection", SITE_URL));
    }

    // Check if user already exists in public.users
    const { data: existingUser, error: lookupError } = await admin
      .from("users")
      .select("id, email, role, full_name, onboarding_complete")
      .eq("id", authUser.id)
      .maybeSingle();

    if (lookupError) {
      console.error("[auth/callback] User lookup failed:", lookupError);
      return NextResponse.redirect(new URL("/login?error=auth_callback_failed", SITE_URL));
    }

    if (!existingUser) {
      // New user — create record with null role and onboarding_complete=false
      const { error: insertError } = await admin.from("users").insert({
        id: authUser.id,
        email: authUser.email ?? "",
        role: null,
        full_name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null,
        onboarding_complete: false,
      });

      if (insertError) {
        console.error("[auth/callback] User insert failed:", insertError);
        return NextResponse.redirect(new URL("/login?error=auth_callback_failed", SITE_URL));
      }

      // Brand new user → must select role
      return NextResponse.redirect(new URL("/onboarding/role-selection", SITE_URL));
    }

    // Existing user — check state
    if (!existingUser.role) {
      // Has account but never selected role
      return NextResponse.redirect(new URL("/onboarding/role-selection", SITE_URL));
    }

    if (!existingUser.onboarding_complete) {
      // Has role but never finished onboarding
      return NextResponse.redirect(new URL("/onboarding", SITE_URL));
    }

    // Fully onboarded — send to the correct dashboard
    const destination = existingUser.role === "doctor" ? "/doctor" : "/patient";
    return NextResponse.redirect(new URL(destination, SITE_URL));
  } catch (err) {
    console.error("[auth/callback] Unexpected error:", err);
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", SITE_URL));
  }
}
