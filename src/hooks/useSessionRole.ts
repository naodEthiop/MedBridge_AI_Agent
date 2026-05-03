"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import type { SessionUser } from "@/lib/auth/types";

export type PortalRole = "patient" | "doctor" | null;

type SessionState = {
  role: PortalRole;
  email: string | null;
  loading: boolean;
};

type SessionResponse =
  | { authenticated: false }
  | { authenticated: true; mode?: string; user: SessionUser };

export function useSessionRole(): SessionState {
  const [state, setState] = useState<SessionState>({ role: null, email: null, loading: true });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "same-origin" });
        if (!res.ok) {
          if (!cancelled) setState({ role: null, email: null, loading: false });
          return;
        }
        const data = (await res.json()) as SessionResponse;
        if (!cancelled) {
          if (!data.authenticated || !("user" in data)) {
            setState({ role: null, email: null, loading: false });
            return;
          }
          setState({
            role: data.user.role,
            email: data.user.email ?? null,
            loading: false,
          });
        }
      } catch {
        if (!cancelled) setState({ role: null, email: null, loading: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** Full session user including patientProfile / doctorProfile (for health card & settings). */
export function useAuthSession() {
  return useQuery({
    queryKey: ["auth-session-user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/session", { credentials: "same-origin" });
      const data = (await res.json()) as SessionResponse;
      if (!res.ok || !data.authenticated || !("user" in data)) {
        throw new Error("Not authenticated");
      }
      return data.user;
    },
    retry: false,
    staleTime: 30_000,
  });
}
