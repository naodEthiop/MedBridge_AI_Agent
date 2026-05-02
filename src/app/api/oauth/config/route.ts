import { NextResponse } from "next/server";

export async function GET() {
  const hasGoogleClientId = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
  const hasGoogleClientSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET);

  return NextResponse.json({
    ok: true,
    provider: "google",
    configured: hasGoogleClientId && hasGoogleClientSecret,
    checks: {
      hasGoogleClientId,
      hasGoogleClientSecret,
    },
  });
}
