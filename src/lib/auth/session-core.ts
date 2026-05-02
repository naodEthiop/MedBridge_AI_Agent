import { sealSessionJson, unsealSessionJson } from "@/lib/auth/session-token";
import type { SessionPayload, SessionUser } from "@/lib/auth/types";
import { env } from "@/lib/env";

export const SESSION_COOKIE = "medbridge_session";
const TTL_SEC = 60 * 60 * 24 * 7;

export function getSessionSecret(): string {
  return env.AUTH_SESSION_SECRET?.trim() || "dev-medbridge-session-secret-change-me";
}

export async function createSessionCookie(user: SessionUser): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + TTL_SEC;
  const payload: SessionPayload = { ...user, exp };
  return sealSessionJson(getSessionSecret(), payload);
}

export async function readSessionFromCookieValue(token: string): Promise<SessionUser | null> {
  const data = await unsealSessionJson<SessionPayload>(getSessionSecret(), token);
  if (!data?.email || !data.role || !data.exp) return null;
  if (data.exp * 1000 < Date.now()) return null;
  const { exp: _e, ...user } = data;
  return user;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SEC,
  };
}
