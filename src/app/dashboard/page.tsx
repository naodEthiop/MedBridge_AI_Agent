"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetchJson } from "@/lib/api/client";
import { supabase } from "@/lib/db/supabaseClient";
import { normalizeAppRole, postLoginPathForRole } from "@/lib/supabase/persistUserRole";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Redirecting…");

  useEffect(() => {
    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        router.replace("/login?next=/dashboard");
        return;
      }
      const me = await apiFetchJson<{ ok?: boolean; user?: { role?: string } }>("/api/user/me", { bearerToken: token });
      if (!me.success || !me.data.user) {
        router.replace("/login?next=/dashboard");
        return;
      }
      const role = normalizeAppRole(me.data.user.role ?? null);
      setMessage("Loading your workspace…");
      router.replace(postLoginPathForRole(role));
    })();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-sahara-bg text-sahara-muted">
      <p className="text-sm">{message}</p>
    </main>
  );
}
