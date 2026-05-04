<<<<<<< Updated upstream
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/db/supabaseServer";
import { env } from "@/lib/env";

const PROD_SITE_URL = env.NEXT_PUBLIC_SITE_URL ?? "https://med-bridge-ai-agent.vercel.app";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_oauth_code", PROD_SITE_URL));
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(new URL("/login?error=auth_callback_failed", PROD_SITE_URL));
    }

    const target = nextPath && nextPath.startsWith("/") ? nextPath : "/onboarding";
    return NextResponse.redirect(new URL(target, PROD_SITE_URL));
  } catch (error) {
    console.error("OAuth callback crash", error);
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", PROD_SITE_URL));
  }
=======
import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/db/supabaseServer'
import { API_URL, env } from '@/lib/env'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const baseUrl = env.NEXT_PUBLIC_SITE_URL || API_URL;

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=auth_callback_failed', baseUrl))
  }

  try {
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/login?error=auth_callback_failed', baseUrl))
    }
    return NextResponse.redirect(new URL('/dashboard', baseUrl))
  } catch (error) {
    console.error('Unexpected auth callback failure:', error)
    return NextResponse.redirect(new URL('/login?error=auth_callback_failed', baseUrl))
  }
>>>>>>> Stashed changes
}
