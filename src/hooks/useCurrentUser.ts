"use client";

import { useEffect, useState } from "react";

export type CurrentUser = {
  userId: string;
  email: string | null;
  role: "patient" | "doctor" | null;
  fullName: string | null;
  onboardingComplete: boolean;
};

type State = {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
};

/**
 * Global hook: fetches the current user from public.users via /api/user/me.
 * DB is the single source of truth — no user_metadata, no local state guesses.
 */
export function useCurrentUser(): State {
  const [state, setState] = useState<State>({ user: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/user/me", { credentials: "same-origin" })
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.ok) {
          setState({ user: null, loading: false, error: json.error ?? "Failed to load user." });
          return;
        }
        setState({ user: json.user as CurrentUser, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ user: null, loading: false, error: err instanceof Error ? err.message : "Network error." });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
