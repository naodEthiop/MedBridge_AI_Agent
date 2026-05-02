<<<<<<< HEAD:src/middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
=======
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
>>>>>>> 55794be (refactor: remove middleware and enhance auth pages with Suspense):src/proxy.ts

import { readSessionFromCookieValue, SESSION_COOKIE } from "@/lib/auth/session-core";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

<<<<<<< HEAD:src/middleware.ts
  const user = await readSessionFromCookieValue(token);
=======
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const user = await getAuthUserFromRequest(req);

  // Supabase browser sessions live in localStorage by default; middleware cannot see them.
  // Only enforce role rules when we have a server-visible token (cookies / Authorization).
>>>>>>> 55794be (refactor: remove middleware and enhance auth pages with Suspense):src/proxy.ts
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/patient", "/patient/:path*", "/doctor", "/doctor/:path*"],
};
