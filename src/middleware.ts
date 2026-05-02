import { NextResponse, type NextRequest } from "next/server";

import { getAuthUserFromRequest } from "@/lib/server/authUser";

function redirectToLogin(req: NextRequest) {
  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl);
}

function redirectUnauthorized(req: NextRequest) {
  const unauthorizedUrl = new URL("/unauthorized", req.url);
  return NextResponse.redirect(unauthorizedUrl);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const user = await getAuthUserFromRequest(req);

  // Supabase browser sessions live in localStorage by default; middleware cannot see them.
  // Only enforce role rules when we have a server-visible token (cookies / Authorization).
  if (!user) {
    return NextResponse.next();
  }

  const role = user.role || "patient";
  const isDoctorPath = pathname.startsWith("/doctor");
  const isPatientPath = pathname.startsWith("/patient");
  const isSharedPath = pathname === "/cases" || pathname === "/profile";

  if (isDoctorPath && role !== "doctor") {
    return redirectUnauthorized(req);
  }

  if (isPatientPath && role !== "patient") {
    return redirectUnauthorized(req);
  }

  if (isSharedPath) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/doctor/:path*", "/patient/:path*", "/cases", "/profile"],
};
