import { NextResponse } from "next/server";
import { requireSessionPrincipal } from "@/lib/server/sessionPrincipal";
import { supabaseMCP } from "@/lib/db/supabaseMCP";

export async function POST(request: Request) {
  try {
    const principal = await requireSessionPrincipal(request);
    const body = (await request.json()) as { role?: "patient" | "doctor" };
    if (body.role !== "patient" && body.role !== "doctor") {
      return NextResponse.json({ ok: false, error: "Invalid role" }, { status: 400 });
    }
    await supabaseMCP.update("users", principal.userId, {
      role: body.role,
      tenant_id: principal.tenantId,
    });
    return NextResponse.json({ ok: true, role: body.role });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }
}
