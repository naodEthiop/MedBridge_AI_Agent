import { NextResponse } from "next/server";

import { requireSessionPrincipal } from "@/lib/server/sessionPrincipal";
import { supabaseMCP } from "@/lib/db/supabaseMCP";

export async function GET(request: Request) {
  try {
    const principal = await requireSessionPrincipal(request);
    const users = await supabaseMCP.query("users", {
      match: { id: principal.userId, tenant_id: principal.tenantId },
      limit: 1,
    });
    const row = users[0] ?? null;

    return NextResponse.json({
      ok: true,
      user: {
        userId: principal.userId,
        email: (row?.email as string | null) ?? principal.email,
        role: (row?.role as "patient" | "doctor" | null) ?? principal.role,
        fullName: (row?.full_name as string | null) ?? null,
        onboardingComplete: Boolean(row?.onboarding_complete),
        tenantId: principal.tenantId,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }
}
