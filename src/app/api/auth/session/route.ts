import { NextResponse } from "next/server";

import { UnauthorizedError } from "@/lib/server/authErrors";
import { requireSessionPrincipal } from "@/lib/server/sessionPrincipal";

/**
 * Strict session probe: succeeds only with a valid sealed session or Supabase access token.
 * Returns userId, role, fullName, onboardingComplete from public.users (DB single source of truth).
 */
export async function GET(request: Request) {
  try {
    const p = await requireSessionPrincipal(request);
    return NextResponse.json({
      ok: true,
      authenticated: true,
      userId: p.userId,
      tenantId: p.tenantId,
      role: p.role,
      fullName: p.fullName,
      onboardingComplete: p.onboardingComplete,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { ok: false, authenticated: false, error: error.message },
        { status: 401 },
      );
    }
    const message = error instanceof Error ? error.message : "Unable to validate session";
    console.error("[auth/session]", message, error);
    return NextResponse.json({ ok: false, authenticated: false, error: message }, { status: 500 });
  }
}
