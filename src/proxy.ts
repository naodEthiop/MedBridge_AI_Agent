import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { readSessionFromCookieValue, SESSION_COOKIE } from "@/lib/auth/session-core";
import { getAuthUserFromRequest } from "@/lib/server/authUser";

function safeInternalPath(nextParam: string | null): string | null {
  if (!nextParam || !nextParam.startsWith("/") || nextParam.startsWith("//")) return null;
  try {
    const u = new URL(nextParam, "http://local.invalid");
    if (u.username || u.password) return null;
    const path = u.pathname + u.search + u.hash;
    if (!path.startsWith("/") || path.includes("//")) return null;
    return path;
  } catch {
    return null;
  }
}

function redirect(request: NextRequest, path: string, sessionResponse: NextResponse) {
  const res = NextResponse.redirect(new URL(path, request.url));
  const cookies = sessionResponse.headers.getSetCookie?.() ?? [];
  for (const c of cookies) {
    res.headers.append("Set-Cookie", c);
  }
  return res;
}

async function resolveSession(
  request: NextRequest,
  baseResponse: NextResponse,
): Promise<{
  user: { role: string } | null;
  response: NextResponse;
  sealedInvalid: boolean;
}> {
  const sealed = request.cookies.get(SESSION_COOKIE)?.value;
  if (sealed) {
    const sessionUser = await readSessionFromCookieValue(sealed);
    if (sessionUser) {
      return { user: { role: sessionUser.role }, response: baseResponse, sealedInvalid: false };
    }
    return { user: null, response: baseResponse, sealedInvalid: true };
  }

  const authUser = await getAuthUserFromRequest(request);
  if (authUser) {
    return { user: { role: authUser.role }, response: baseResponse, sealedInvalid: false };
  }

  return { user: null, response: baseResponse, sealedInvalid: false };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    const { user, response: sessionResponse, sealedInvalid } = await resolveSession(request, response);
    if (sealedInvalid || !user) {
      return sessionResponse;
    }

    const nextPath = safeInternalPath(request.nextUrl.searchParams.get("next"));
    if (nextPath) {
      if (nextPath.startsWith("/doctor") && user.role === "doctor") {
        return redirect(request, nextPath, sessionResponse);
      }
      if (nextPath.startsWith("/patient") && user.role === "patient") {
        return redirect(request, nextPath, sessionResponse);
      }
      if (!nextPath.startsWith("/doctor") && !nextPath.startsWith("/patient")) {
        return redirect(request, nextPath, sessionResponse);
      }
    }
    const home = user.role === "doctor" ? "/doctor/dashboard" : "/patient";
    return redirect(request, home, sessionResponse);
  }

  const { user, response: sessionResponse, sealedInvalid } = await resolveSession(request, response);

  if (sealedInvalid) {
    const login = new URL("/login", request.url);
    login.searchParams.set("expired", "1");
    return NextResponse.redirect(login);
  }

  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/doctor") && user.role !== "doctor") {
    return redirect(request, "/patient", sessionResponse);
  }
  if (pathname.startsWith("/patient") && user.role !== "patient") {
    return redirect(request, "/doctor/dashboard", sessionResponse);
  }

  if (pathname.startsWith("/onboarding") && user.role !== "patient") {
    return redirect(request, "/doctor/dashboard", sessionResponse);
  }

  return sessionResponse;
}

export const config = {
  matcher: [
    "/login",
    "/login/:path*",
    "/patient",
    "/patient/:path*",
    "/doctor",
    "/doctor/:path*",
    "/provider",
    "/provider/:path*",
    "/onboarding",
    "/onboarding/:path*",
  ],
};
