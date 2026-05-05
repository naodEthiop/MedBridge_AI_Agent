import { NextResponse } from "next/server";
import { requireSessionPrincipal } from "@/lib/server/sessionPrincipal";
import { supabaseMCP } from "@/lib/db/supabaseMCP";

export async function POST(request: Request) {
  try {
    const principal = await requireSessionPrincipal(request);
    const body = (await request.json()) as Record<string, unknown>;
    const role = body.role;
    if (role !== "patient" && role !== "doctor") return NextResponse.json({ ok: false, error: "Invalid role" }, { status: 400 });

    await supabaseMCP.update("users", principal.userId, {
      full_name: String(body.fullName ?? ""),
      onboarding_complete: true,
      role,
      tenant_id: principal.tenantId,
    });

    await supabaseMCP.insert("onboarding_profiles", {
      user_id: principal.userId,
      tenant_id: principal.tenantId,
      role,
      payload: body,
    });

    return NextResponse.json({ ok: true, redirectTo: role === "doctor" ? "/doctor" : "/patient" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }
}
