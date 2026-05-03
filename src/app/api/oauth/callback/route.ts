import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/server/authUser";

const REFRESH_COOKIE_NAME = "medbridge-refresh-token";
const ACCESS_COOKIE_NAME = "medbridge-access-token";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const redirectUri = url.searchParams.get("redirect_uri") || `${url.origin}/auth/callback`;
  const nextPath = url.searchParams.get("next") || "/doctor";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", url.origin));
  }

  try {
    console.info("[auth] oauth callback endpoint received code", {
      hasState: Boolean(state),
    });

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      console.error("[auth] oauth callback endpoint missing Supabase configuration");
      return NextResponse.redirect(new URL("/login?error=oauth_failed", url.origin));
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.session) {
      const message = error?.message || "";
      const isExternalGoogleCode = code.startsWith("4/") || message.toLowerCase().includes("external code");

      if (!isExternalGoogleCode) {
        console.error("[auth] exchangeCodeForSession failed", message);
        return NextResponse.redirect(new URL("/login?error=oauth_failed", url.origin));
      }

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        console.error("[auth] external Google code received without server OAuth env vars");
        return NextResponse.redirect(new URL("/login?error=oauth_failed", url.origin));
      }

      console.info("[auth] falling back to Google code exchange", { hasState: Boolean(state) });
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      const tokenJson = (await tokenRes.json()) as {
        id_token?: string;
        error?: string;
        error_description?: string;
      };

      if (!tokenRes.ok || !tokenJson.id_token) {
        console.error("[auth] Google token exchange failed", tokenJson.error || tokenJson.error_description);
        return NextResponse.redirect(new URL("/login?error=oauth_failed", url.origin));
      }

      const idTokenLogin = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: tokenJson.id_token,
      });
      if (idTokenLogin.error || !idTokenLogin.data.session) {
        console.error("[auth] Supabase signInWithIdToken failed", idTokenLogin.error?.message);
        return NextResponse.redirect(new URL("/login?error=oauth_failed", url.origin));
      }

      const response = NextResponse.redirect(new URL(nextPath, url.origin));
      response.cookies.set(ACCESS_COOKIE_NAME, idTokenLogin.data.session.access_token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: idTokenLogin.data.session.expires_in ?? 3600,
      });
      response.cookies.set(REFRESH_COOKIE_NAME, idTokenLogin.data.session.refresh_token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return response;
    }

    const response = NextResponse.redirect(new URL(nextPath, url.origin));
    response.cookies.set(ACCESS_COOKIE_NAME, data.session.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: data.session.expires_in ?? 3600,
    });
    response.cookies.set(REFRESH_COOKIE_NAME, data.session.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("[auth] oauth callback endpoint unexpected error", error);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", url.origin));
  }
}
