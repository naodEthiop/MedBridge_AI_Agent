import { readSessionFromCookieValue, SESSION_COOKIE } from "@/lib/auth/session-core";
import { getSupabaseServerClient } from "@/lib/db/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/env";
import { UnauthorizedError } from "@/lib/server/authErrors";

const DEFAULT_TENANT = process.env.DEFAULT_TENANT_ID?.trim() || "medbridge-tenant-001";

function getCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const part = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  if (!part) return null;
  const value = part.slice(name.length + 1);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export type SessionPrincipal = {
  userId: string;
  email: string | null;
  /** null means user is authenticated but has not yet selected a role */
  role: "patient" | "doctor" | null;
  tenantId: string;
  fullName: string | null;
  onboardingComplete: boolean;
  source: "supabase" | "sealed_session";
};

/**
 * Resolves the signed-in principal from cookies.
 * Uses public.users as single source of truth for role, full_name, onboarding_complete.
 * Returns null only when no valid auth session exists.
 */
export async function resolveSessionPrincipal(request: Request): Promise<SessionPrincipal | null> {
  // Try sealed MedBridge session cookie first (email/password login)
  const sealed = getCookieValue(request, SESSION_COOKIE);
  if (sealed) {
    const sessionUser = await readSessionFromCookieValue(sealed);
    if (sessionUser?.email) {
      const sealedMeta = sessionUser as unknown as { tenantId?: unknown };
      const tenantId =
        (typeof sealedMeta.tenantId === "string" ? sealedMeta.tenantId : null) || DEFAULT_TENANT;
      return {
        userId: sessionUser.id ?? sessionUser.email,
        email: sessionUser.email,
        role: (sessionUser.role as "patient" | "doctor") ?? null,
        tenantId,
        fullName: null,
        onboardingComplete: false,
        source: "sealed_session",
      };
    }
  }

  if (!hasSupabasePublicEnv) {
    return null;
  }

  // Try Supabase session (Google OAuth / access token cookie)
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  const authUserId = data.user.id;
  const tenantId = DEFAULT_TENANT;

  // Fetch authoritative role/onboarding state from public.users
  const admin = createSupabaseAdminClient();
  if (admin) {
    const { data: dbUser } = await admin
      .from("users")
      .select("role, full_name, onboarding_complete")
      .eq("id", authUserId)
      .maybeSingle();

    if (dbUser) {
      return {
        userId: authUserId,
        email: data.user.email ?? null,
        role: (dbUser.role as "patient" | "doctor" | null) ?? null,
        tenantId,
        fullName: (dbUser.full_name as string | null) ?? null,
        onboardingComplete: Boolean(dbUser.onboarding_complete),
        source: "supabase",
      };
    }
  }

  // Admin client unavailable or user not in DB yet — return minimal principal with null role
  return {
    userId: authUserId,
    email: data.user.email ?? null,
    role: null,
    tenantId,
    fullName: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
    onboardingComplete: false,
    source: "supabase",
  };
}

export async function requireSessionPrincipal(request: Request): Promise<SessionPrincipal> {
  const p = await resolveSessionPrincipal(request);
  if (!p) {
    throw new UnauthorizedError("No valid session. Sign in to continue.");
  }
  return p;
}
