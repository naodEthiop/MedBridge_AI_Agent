import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/db/supabaseServer";
import { env } from "@/lib/env";
import { supabaseMCP } from "@/lib/db/supabaseMCP";

const PROD_SITE_URL = env.NEXT_PUBLIC_SITE_URL ?? "https://med-bridge-ai-agent.vercel.app";
const DEFAULT_TENANT = process.env.DEFAULT_TENANT_ID?.trim() || "medbridge-tenant-001";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_oauth_code", PROD_SITE_URL));
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/login?error=auth_callback_failed", PROD_SITE_URL));
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user?.id || !userData.user?.email) {
      return NextResponse.redirect(new URL("/login?error=auth_callback_failed", PROD_SITE_URL));
    }

    const userId = userData.user.id;
    const email = userData.user.email;
    const tenantId = DEFAULT_TENANT;

    const existing = await supabaseMCP.query("users", { match: { id: userId, tenant_id: tenantId }, limit: 1 });
    if (existing.length === 0) {
      await supabaseMCP.insert("users", {
        id: userId,
        email,
        role: null,
        onboarding_complete: false,
        tenant_id: tenantId,
      });
    }

    const user = existing[0] ?? null;
    const role = (user?.role as string | null) ?? null;
    const onboardingComplete = Boolean(user?.onboarding_complete);

    if (!role) return NextResponse.redirect(new URL("/onboarding/role-selection", PROD_SITE_URL));
    if (!onboardingComplete) return NextResponse.redirect(new URL(role === "doctor" ? "/onboarding/doctor" : "/onboarding/patient", PROD_SITE_URL));
    return NextResponse.redirect(new URL(role === "doctor" ? "/doctor" : "/patient", PROD_SITE_URL));
  } catch {
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", PROD_SITE_URL));
  }
}
