import { NextResponse } from "next/server";

import { getCaseById } from "@/lib/backend/case-service";
import { getAccessTokenFromRequest } from "@/lib/server/authUser";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const token = getAccessTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const record = await getCaseById(id, token);
  if (!record) {
    return NextResponse.json({ ok: false, error: "Case not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, case: record });
}
