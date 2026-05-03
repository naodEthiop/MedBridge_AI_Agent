"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  normalizeAppRole,
  postLoginPathForRole,
  SELECTED_ROLE_STORAGE_KEY,
  upsertUserRoleRow,
} from "@/lib/supabase/persistUserRole";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (cancelled) return;

        if (sessionError || !sessionData.session?.access_token) {
          setMessage("Could not complete Google sign-in.");
          router.replace("/login?error=oauth");
          return;
        }

        const sync = await fetch("/api/auth/sync", {
          method: "POST",
          headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        });
        const body = (await sync.json()) as { ok?: boolean; user?: { role: "patient" | "doctor" }; error?: string };
        if (!sync.ok || body.ok === false) {
          setMessage(body.error ?? "Sync failed.");
          router.replace("/login?error=sync");
          return;
        }

        const stored =
          typeof window !== "undefined" ? window.localStorage.getItem(SELECTED_ROLE_STORAGE_KEY) : null;
        const role = stored ? normalizeAppRole(stored) : normalizeAppRole(body.user?.role ?? "patient");
        await upsertUserRoleRow(supabase, sessionData.session, role);

        const next = searchParams.get("next");
        if (next && next.startsWith("/")) {
          router.replace(next);
          return;
        }
        router.replace(postLoginPathForRole(role));
      } catch {
        if (!cancelled) {
          setMessage("Something went wrong.");
          router.replace("/login?error=sync");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sahara-bg px-6 text-center">
      <p className="font-serif text-xl text-sahara-fg">{message}</p>
      <p className="mt-2 text-sm text-sahara-muted">You will be redirected shortly.</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-sahara-bg px-6 text-sahara-fg">
          <div className="w-full max-w-md rounded-2xl border border-sahara-border/50 bg-white p-8 shadow-ambient">
            <h1 className="mb-3 text-center font-serif text-2xl">Signing you in...</h1>
            <p className="text-center text-sm text-sahara-muted">Loading...</p>
          </div>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
