import { createClient } from "@supabase/supabase-js";

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
  if (!hasSupabasePublicEnv) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getAuthUserFromRequest(req: Request): Promise<AuthUser | null> {
  if (!hasSupabasePublicEnv) return null;

  const token = getAccessTokenFromRequest(req);
  if (!token) return null;

  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    role: String(data.user.user_metadata?.role ?? "patient"),
  };
}
