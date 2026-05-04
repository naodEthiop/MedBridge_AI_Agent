import { readSessionFromCookieValue, SESSION_COOKIE } from "@/lib/auth/session-core";
import { getSupabaseServerClient } from "@/lib/db/supabaseServer";
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
  role: "patient" | "doctor";
  tenantId: string;
  source: "supabase" | "sealed_session";
};

/**
 * Resolves the signed-in principal from cookies (sealed MedBridge session first, then Supabase access tokens).
 * No silent fallbacks: returns null only when nothing valid is present (caller should return 401).
 */
export async function resolveSessionPrincipal(request: Request): Promise<SessionPrincipal | null> {
  const sealed = getCookieValue(request, SESSION_COOKIE);
  if (sealed) {
    const sessionUser = await readSessionFromCookieValue(sealed);
    if (sessionUser?.email && sessionUser.role) {
      const sealedMeta = sessionUser as unknown as { tenantId?: unknown };
      const tenantId =
        (typeof sealedMeta.tenantId === "string" ? sealedMeta.tenantId : null) || DEFAULT_TENANT;
      return {
        userId: sessionUser.email,
        email: sessionUser.email,
        role: sessionUser.role as "patient" | "doctor",
        tenantId,
        source: "sealed_session",
      };
    }
  }

  if (!hasSupabasePublicEnv) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  const meta = data.user.user_metadata as Record<string, unknown> | undefined;
  const tenantFromMeta = typeof meta?.tenant_id === "string" ? meta.tenant_id : null;

  return {
    userId: data.user.id,
    email: data.user.email ?? null,
    role: meta?.role === "doctor" ? "doctor" : "patient",
    tenantId: tenantFromMeta || DEFAULT_TENANT,
    source: "supabase",
  };
}

export async function requireSessionPrincipal(request: Request): Promise<SessionPrincipal> {
  const p = await resolveSessionPrincipal(request);
  if (!p) {
    throw new UnauthorizedError("No valid session. Sign in with a MedBridge session or Supabase access token.");
  }
  return p;
}
