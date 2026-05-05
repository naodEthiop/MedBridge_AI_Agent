import { NextResponse } from "next/server";
import { requireSessionPrincipal } from "@/lib/server/sessionPrincipal";
import { supabaseMCP } from "@/lib/db/supabaseMCP";

export async function POST(request: Request) {
  try {
    const principal = await requireSessionPrincipal(request);
    const body = (await request.json()) as Record<string, unknown>;
    const role = body.role;
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";

    if ((role !== "patient" && role !== "doctor") || !fullName) {
      return NextResponse.json({ success: false, error: "Invalid onboarding payload" }, { status: 400 });
    }

    await supabaseMCP.update("users", principal.userId, {
      role,
      full_name: fullName,
      onboarding_complete: true,
      tenant_id: principal.tenantId,
    });

    return NextResponse.json({ success: true, role });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  }
}
