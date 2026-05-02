import { cookies } from "next/headers";

import { readSessionFromCookieValue, SESSION_COOKIE } from "@/lib/auth/session-core";

export {
  createSessionCookie,
  getSessionSecret,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session-core";

export async function getSessionFromRequestCookies() {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return readSessionFromCookieValue(raw);
}
