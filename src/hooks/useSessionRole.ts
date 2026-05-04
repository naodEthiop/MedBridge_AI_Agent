"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import type { SessionUser, UserRole } from "@/lib/auth/types";

export type PortalRole = UserRole | null;

type SessionState = {
  role: PortalRole;
  email: string | null;
  tenantId: string | null;
  loading: boolean;
};

type FlatSessionOk = {
  ok?: boolean;
  authenticated?: boolean;
  userId?: string;
  tenantId?: string;
  role?: UserRole;
};

function mapSessionUser(data: FlatSessionOk): SessionUser | null {
  if (!data.authenticated || !data.userId || !data.role) return null;
  return {
    email: data.userId,
    role: data.role,
  };
}

export function useSessionRole(): SessionState {
  const [state, setState] = useState<SessionState>({ role: null, email: null, tenantId: null, loading: true });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "same-origin" });
        if (!res.ok) {
          if (!cancelled) setState({ role: null, email: null, tenantId: null, loading: false });
          return;
        }
        const data = (await res.json()) as FlatSessionOk;
        if (!cancelled) {
          if (!data.authenticated || !data.role || !data.userId) {
            setState({ role: null, email: null, tenantId: null, loading: false });
            return;
          }
          setState({
            role: data.role,
            email: data.userId,
            tenantId: data.tenantId ?? null,
            loading: false,
          });
        }
      } catch {
        if (!cancelled) setState({ role: null, email: null, tenantId: null, loading: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** Full session user (sealed session uses email as principal id). */
export function useAuthSession() {
  return useQuery({
    queryKey: ["auth-session-user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/session", { credentials: "same-origin" });
      const data = (await res.json()) as FlatSessionOk;
      if (!res.ok || !data.authenticated) {
        throw new Error("Not authenticated");
      }
      const user = mapSessionUser(data);
      if (!user) throw new Error("Not authenticated");
      return user;
    },
    retry: false,
    staleTime: 30_000,
  });
}
