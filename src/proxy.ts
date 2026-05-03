import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { readSessionFromCookieValue, SESSION_COOKIE } from "@/lib/auth/session-core";
import { getAuthUserFromRequest } from "@/lib/server/authUser";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sealed = request.cookies.get(SESSION_COOKIE)?.value;

  let role: string | null = null;

  if (sealed) {
    const sessionUser = await readSessionFromCookieValue(sealed);
    if (!sessionUser) {
      const login = new URL("/login", request.url);
      login.searchParams.set("expired", "1");
      return NextResponse.redirect(login);
    }
    role = sessionUser.role;
  } else {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser) {
      return NextResponse.next();
    }
    role = authUser.role;
  }

  if (pathname.startsWith("/doctor") && role !== "doctor") {
    return NextResponse.redirect(new URL("/patient", request.url));
  }
  if (pathname.startsWith("/patient") && role !== "patient") {
    return NextResponse.redirect(new URL("/doctor/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/patient", "/patient/:path*", "/doctor", "/doctor/:path*"],
};
