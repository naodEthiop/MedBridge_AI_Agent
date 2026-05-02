import { NextResponse } from "next/server";

import { getSessionFromRequestCookies } from "@/lib/server/session-cookie";

export async function GET() {
  const user = await getSessionFromRequestCookies();
  if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, mode: "demo", user });
}
