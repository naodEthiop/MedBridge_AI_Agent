import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/server/authUser";

const REFRESH_COOKIE_NAME = "medbridge-refresh-token";
const ACCESS_COOKIE_NAME = "medbridge-access-token";

type RefreshBody = {
  refresh_token?: string;
};

export async function POST(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
    let bodyToken: string | undefined;

    try {
      const body = (await req.json()) as RefreshBody;
      bodyToken = body.refresh_token;
    } catch {
      bodyToken = undefined;
    }

    const refreshToken = bodyToken || cookieToken;
    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: "Missing refresh token" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Supabase is not configured." },
        { status: 503 },
      );
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      return NextResponse.json(
        { success: false, error: error?.message || "Invalid or expired refresh token" },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      success: true,
      access_token: data.session.access_token,
      expires_at: data.session.expires_at,
    });

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
    const message = error instanceof Error ? error.message : "Refresh failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
