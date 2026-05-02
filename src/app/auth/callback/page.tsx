"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  normalizeAppRole,
  postLoginPathForRole,
  SELECTED_ROLE_STORAGE_KEY,
  upsertUserRoleRow,
} from "@/lib/supabase/persistUserRole";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let active = true;

    async function completeGoogleLogin() {
      console.info("[auth] OAuth callback triggered");

      const oauthError = searchParams.get("error_description") ?? searchParams.get("error");
      if (oauthError) {
        if (active) router.replace("/login?error=oauth_failed");
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();

        const resolveNextPath = () => {
          const role = normalizeAppRole(
            typeof window !== "undefined" ? localStorage.getItem(SELECTED_ROLE_STORAGE_KEY) : null,
          );
          return searchParams.get("next") || postLoginPathForRole(role);
        };

        const { data: initialSession, error: initialErr } = await supabase.auth.getSession();
        if (initialErr) throw initialErr;
        console.info("[auth] Session exists:", Boolean(initialSession.session));
        if (initialSession.session) {
          const role = normalizeAppRole(
            typeof window !== "undefined" ? localStorage.getItem(SELECTED_ROLE_STORAGE_KEY) : null,
          );
          await upsertUserRoleRow(supabase, initialSession.session, role);
          router.replace(resolveNextPath());
          return;
        }

        const code = searchParams.get("code");
        if (code) {
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) throw exchangeErr;
          const { data: afterExchange, error: afterErr } = await supabase.auth.getSession();
          if (afterErr) throw afterErr;
          console.info("[auth] Session exists:", Boolean(afterExchange.session));
          if (afterExchange.session) {
            const role = normalizeAppRole(
              typeof window !== "undefined" ? localStorage.getItem(SELECTED_ROLE_STORAGE_KEY) : null,
            );
            await upsertUserRoleRow(supabase, afterExchange.session, role);
            router.replace(resolveNextPath());
            return;
          }
        }

        if (active) router.replace("/login?error=oauth_failed");
      } catch {
        if (active) router.replace("/login?error=oauth_failed");
      }
    }

    completeGoogleLogin();
    return () => {
      active = false;
    };
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-sahara-bg px-6 text-sahara-fg">
      <div className="w-full max-w-md rounded-2xl border border-sahara-border/50 bg-white p-8 shadow-ambient">
        <h1 className="mb-3 text-center font-serif text-2xl">Signing you in...</h1>
        <p className="text-center text-sm text-sahara-muted">
          Completing Google authentication and creating your session.
        </p>
      </div>
    </main>
  );
}
