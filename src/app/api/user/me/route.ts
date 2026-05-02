import { NextResponse } from "next/server";

import { getAuthUserFromRequest } from "@/lib/server/authUser";

export async function GET(req: Request) {
  const user = await getAuthUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, user });
}
