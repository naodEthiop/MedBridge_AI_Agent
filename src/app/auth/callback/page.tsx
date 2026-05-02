"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      setMessage("Supabase is not configured.");
      router.replace("/login?google=unavailable");
      return;
    }

    const supabase = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });

    let cancelled = false;

    void (async () => {
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
      const body = (await sync.json()) as { user?: { role: "patient" | "doctor" }; error?: string };
      if (!sync.ok) {
        setMessage(body.error ?? "Sync failed.");
        router.replace("/login?error=sync");
        return;
      }

      const next = searchParams.get("next");
      if (next && next.startsWith("/")) {
        router.replace(next);
        return;
      }
      router.replace(body.user?.role === "doctor" ? "/doctor/dashboard" : "/patient");
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
        <div className="flex min-h-screen items-center justify-center bg-sahara-bg text-sahara-muted">Loading…</div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
