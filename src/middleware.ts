import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { readSessionFromCookieValue, SESSION_COOKIE } from "@/lib/auth/session-core";
import { resolveSessionPrincipal } from "@/lib/server/sessionPrincipal";

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

function redirect(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.url));
}

type ResolvedSession = {
  authenticated: boolean;
  role: string | null;
  sealedInvalid: boolean;
};

async function resolveSession(request: NextRequest): Promise<ResolvedSession> {
  // 1. Try sealed MedBridge session cookie
  const sealed = request.cookies.get(SESSION_COOKIE)?.value;
  if (sealed) {
    const sessionUser = await readSessionFromCookieValue(sealed);
    if (sessionUser) {
      return { authenticated: true, role: sessionUser.role ?? null, sealedInvalid: false };
    }
    // Sealed cookie present but invalid → force re-login
    return { authenticated: false, role: null, sealedInvalid: true };
  }

  // 2. Try Supabase access token (Google OAuth or cookie-based session)
  const authPrincipal = await resolveSessionPrincipal(request);
  if (authPrincipal) {
    return { authenticated: true, role: authPrincipal.role ?? null, sealedInvalid: false };
  }

  return { authenticated: false, role: null, sealedInvalid: false };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── /login — redirect authenticated users to dashboard ────────────────────
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    const { authenticated, role, sealedInvalid } = await resolveSession(request);
    if (!authenticated || sealedInvalid) {
      return NextResponse.next({ request });
    }
    const nextPath = safeInternalPath(request.nextUrl.searchParams.get("next"));
    if (nextPath) {
      if (nextPath.startsWith("/doctor") && role === "doctor") return redirect(request, nextPath);
      if (nextPath.startsWith("/patient") && role === "patient") return redirect(request, nextPath);
      if (!nextPath.startsWith("/doctor") && !nextPath.startsWith("/patient"))
        return redirect(request, nextPath);
    }
    if (!role) return redirect(request, "/onboarding/role-selection");
    return redirect(request, role === "doctor" ? "/doctor" : "/patient");
  }

  // ── Resolve session for all protected routes ───────────────────────────────
  const { authenticated, role, sealedInvalid } = await resolveSession(request);

  // Expired sealed session → force re-login
  if (sealedInvalid) {
    const login = new URL("/login", request.url);
    login.searchParams.set("expired", "1");
    return NextResponse.redirect(login);
  }

  // Unauthenticated → send to login
  if (!authenticated) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  // ── /onboarding/* — any authenticated user may access ─────────────────────
  if (pathname.startsWith("/onboarding")) {
    return NextResponse.next({ request });
  }

  // ── Role-specific route guards ─────────────────────────────────────────────
  if (pathname.startsWith("/doctor") && role !== "doctor") {
    if (!role) return redirect(request, "/onboarding/role-selection");
    return redirect(request, "/patient");
  }
  if (pathname.startsWith("/patient") && role !== "patient") {
    if (!role) return redirect(request, "/onboarding/role-selection");
    return redirect(request, "/doctor");
  }

  return NextResponse.next({ request });
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
