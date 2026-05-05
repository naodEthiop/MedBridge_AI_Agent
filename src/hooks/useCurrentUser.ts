"use client";

import { useEffect, useState } from "react";

export type CurrentUser = {
  userId: string;
  email: string | null;
  role: "patient" | "doctor" | null;
  fullName: string | null;
  onboardingComplete: boolean;
  tenantId: string | null;
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/user/me", { credentials: "same-origin", cache: "no-store" });
        const data = (await res.json()) as { ok?: boolean; user?: CurrentUser; error?: string };
        if (!cancelled) {
          setUser(res.ok && data.ok && data.user ? data.user : null);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading };
}
