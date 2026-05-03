import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { readSessionFromCookieValue, SESSION_COOKIE } from "@/lib/auth/session-core";

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    if (!token) return NextResponse.next();
    const user = await readSessionFromCookieValue(token);
    if (!user) return NextResponse.next();
    const nextPath = safeInternalPath(request.nextUrl.searchParams.get("next"));
    if (nextPath) {
      if (nextPath.startsWith("/doctor") && user.role === "doctor") {
        return NextResponse.redirect(new URL(nextPath, request.url));
      }
      if (nextPath.startsWith("/patient") && user.role === "patient") {
        return NextResponse.redirect(new URL(nextPath, request.url));
      }
      if (!nextPath.startsWith("/doctor") && !nextPath.startsWith("/patient")) {
        return NextResponse.redirect(new URL(nextPath, request.url));
      }
    }
    const home = user.role === "doctor" ? "/doctor/dashboard" : "/patient";
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  const user = await readSessionFromCookieValue(token);
  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("expired", "1");
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/doctor") && user.role !== "doctor") {
    return NextResponse.redirect(new URL("/patient", request.url));
  }
  if (pathname.startsWith("/patient") && user.role !== "patient") {
    return NextResponse.redirect(new URL("/doctor/dashboard", request.url));
  }

  if (pathname.startsWith("/onboarding") && user.role !== "patient") {
    return NextResponse.redirect(new URL("/doctor/dashboard", request.url));
  }

  return NextResponse.next();
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
