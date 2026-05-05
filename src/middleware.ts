import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { readSessionFromCookieValue, SESSION_COOKIE } from "@/lib/auth/session-core";
import { getAuthUserFromRequest } from "@/lib/server/authUser";

async function resolveSession(request: NextRequest) {
  const sealed = request.cookies.get(SESSION_COOKIE)?.value;
  if (sealed) {
    const sessionUser = await readSessionFromCookieValue(sealed);
    if (sessionUser) return { role: sessionUser.role, authenticated: true };
  }
  const authUser = await getAuthUserFromRequest(request);
  if (authUser) return { role: authUser.role, authenticated: true };
  return { role: null, authenticated: false };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await resolveSession(request);

  if (pathname === "/login" || pathname.startsWith("/login/") || pathname === "/auth/login" || pathname.startsWith("/auth/login/")) {
    if (!session.authenticated) return NextResponse.next();
    return NextResponse.redirect(new URL(session.role === "doctor" ? "/doctor" : "/patient", request.url));
  }

  if (!session.authenticated) {
    return NextResponse.redirect(new URL(`/auth/login?next=${encodeURIComponent(pathname)}`, request.url));
  }

  if (pathname.startsWith("/patient") && session.role !== "patient") {
    return NextResponse.redirect(new URL("/doctor", request.url));
  }
  if (pathname.startsWith("/doctor") && session.role !== "doctor") {
    return NextResponse.redirect(new URL("/patient", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/login/:path*", "/auth/login", "/auth/login/:path*", "/patient", "/patient/:path*", "/doctor", "/doctor/:path*", "/onboarding", "/onboarding/:path*"],
};
