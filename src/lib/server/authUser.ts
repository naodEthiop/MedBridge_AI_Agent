import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env, hasSupabasePublicEnv } from "@/lib/env";

export type AuthUser = {
  id: string;
  email: string | null;
  role: string;
};

export function getAccessTokenFromRequest(req: Request) {
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (bearerToken) return bearerToken;

  const cookieHeader = req.headers.get("cookie") ?? "";
  if (!cookieHeader) return null;

  const cookieToken = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("medbridge-access-token="))
    ?.split("=")
    .slice(1)
    .join("=");
  if (cookieToken) return decodeURIComponent(cookieToken);

  const sbAccessToken = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("sb-access-token="))
    ?.split("=")
    .slice(1)
    .join("=");
  if (sbAccessToken) return decodeURIComponent(sbAccessToken);

  return null;
}

export function getSupabaseServerClient() {
  if (!hasSupabasePublicEnv) return null;
  return createSupabaseServerClient();
}

export async function getAuthUserFromRequest(req: Request): Promise<AuthUser | null> {
  if (!hasSupabasePublicEnv) return null;

  const token = getAccessTokenFromRequest(req);
  if (!token) return null;

  const supabase = createSupabaseServerClient(token);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    role: String(data.user.user_metadata?.role ?? "patient"),
  };
}
