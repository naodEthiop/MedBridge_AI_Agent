import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const redirectTo = url.searchParams.get("redirectTo") || "/auth/callback";

  return NextResponse.json({
    ok: true,
    provider: "google",
    message: "Use the client Supabase OAuth flow for redirect.",
    redirectTo,
  });
}
