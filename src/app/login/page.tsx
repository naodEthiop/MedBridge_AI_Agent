"use client";

import Link from "next/link";
import { Eye, EyeOff, ShieldCheck, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  normalizeAppRole,
  postLoginPathForRole,
  SELECTED_ROLE_STORAGE_KEY,
  upsertUserRoleRow,
} from "@/lib/supabase/persistUserRole";

type Role = "patient" | "doctor";
type ModalKind = "forgot" | "signup" | "privacy" | "terms" | "help" | null;

const modalCopy: Record<Exclude<ModalKind, null>, { title: string; content: string }> = {
  forgot: {
    title: "Reset Password",
    content:
      "Enter your registered email, then continue. A reset link will be sent by the auth service when it is connected.",
  },
  signup: {
    title: "Join MedBridge AI",
    content: "Patient onboarding is available now. Provider onboarding starts with professional verification.",
  },
  privacy: {
    title: "Privacy Policy",
    content: "MedBridge keeps health data scoped to care workflows and provider verification.",
  },
  terms: {
    title: "Terms of Service",
    content: "Use MedBridge for care coordination support. Clinical decisions remain with licensed professionals.",
  },
  help: {
    title: "Help Center",
    content: "For patient help, continue to the patient dashboard. For clinical support, open the doctor assistant.",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const [role, setRole] = useState<Role>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const callbackUriPreview = "http://localhost:3000/auth/callback";

  const activeModal = modal ? modalCopy[modal] : null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SELECTED_ROLE_STORAGE_KEY, role);
  }, [role]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    async function checkExistingSession() {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) return;
      console.info("[auth] Session exists:", Boolean(data.session));
      if (data.session && from !== "welcome") {
        const stored =
          typeof window !== "undefined" ? localStorage.getItem(SELECTED_ROLE_STORAGE_KEY) : null;
        const resolvedRole = normalizeAppRole(stored ?? role);
        await upsertUserRoleRow(supabase, data.session, resolvedRole);
        router.replace(postLoginPathForRole(resolvedRole));
      }
    }

    checkExistingSession();
  }, [router, from, role]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.info("[auth] Session exists:", Boolean(session), "event:", event);
      if (event === "SIGNED_IN" && session) {
        const stored =
          typeof window !== "undefined" ? localStorage.getItem(SELECTED_ROLE_STORAGE_KEY) : null;
        const resolvedRole = normalizeAppRole(stored ?? role);
        await upsertUserRoleRow(supabase, session, resolvedRole);
        router.replace(postLoginPathForRole(resolvedRole));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, role]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters for this demo login.");
      return;
    }
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    router.push(postLoginPathForRole(normalizeAppRole(role)));
    setLoading(false);
  }

  async function handleGoogleLogin() {
    console.info("[auth] Google button clicked");
    setGoogleError(null);
    setIsGoogleLoading(true);

    try {
      const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
      const hasSupabaseAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      const hasGoogleClientId = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

      console.info("[auth] OAuth env status", {
        hasSupabaseUrl,
        hasSupabaseAnonKey,
        hasGoogleClientId,
      });

      if (!hasGoogleClientId) {
        throw new Error("Google OAuth is missing NEXT_PUBLIC_GOOGLE_CLIENT_ID.");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(SELECTED_ROLE_STORAGE_KEY, role);
      }

      const supabase = getSupabaseBrowserClient();
      const redirectTo = "http://localhost:3000/auth/callback";

      console.info("[auth] Starting Supabase Google OAuth redirect", { redirectTo });
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (oauthError) throw oauthError;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to continue with Google right now.";
      console.error("[auth] Google login failed", message);
      setGoogleError(message);
      setIsGoogleLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-sahara-bg text-sahara-fg">
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <section className="relative hidden overflow-hidden bg-sahara-surface-low md:flex md:w-1/2">
          <div className="absolute inset-0 z-0">
            <img
              className="h-full w-full object-cover opacity-80 mix-blend-multiply"
              alt="AI medical assistant interface"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMREo5qDfL3Py_BqaeC79b5J96p_Z7hK4wen9dJBNq8H1pd6_08D5HEmK9ZAtlC71CseUQSqvhnBy-9RAknqZaYRxLpeYKp_uDgAHE9qvwa0bpd-GpaZ0ifz58pzdDIUTS0BrC0dzg9MrrdImlquYxXpjZNK7IZON7ToH5ff6D213bqVqYFC7qBHeewdBEvZ6vnRSBzw033XHCp-7dPDPoXFB1YBHAfhUAKoO56XXIFNmxnYCOZ1lXmobWEtQMVEGehvo2s1AgYy4"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-sahara-bg/90 via-sahara-bg/40 to-transparent" />
          </div>
          <div className="relative z-10 flex h-full w-full flex-col justify-between p-16">
            <div>
              <h1 className="font-serif text-3xl font-bold tracking-tight text-sahara-primary">MedBridge</h1>
              <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-sahara-primary/30 to-transparent" />
            </div>
            <div className="max-w-md">
              <h2 className="mb-6 font-serif text-6xl leading-tight text-sahara-fg">Your AI Health Companion</h2>
              <p className="text-xl font-light tracking-wide text-sahara-muted">
                Smart, safe, always available care coordination.
              </p>
            </div>
            <div className="flex items-center gap-4 text-sahara-primary">
              <ShieldCheck className="size-8" />
              <span className="text-sm font-semibold uppercase tracking-widest">Trusted by care teams</span>
            </div>
          </div>
        </section>

        <section className="flex w-full items-center justify-center bg-sahara-bg p-6 md:w-1/2 md:p-12 lg:p-24">
          <div className="w-full max-w-md">
            <div className="mb-12 text-center md:hidden">
              <h1 className="font-serif text-3xl font-bold text-sahara-primary">MedBridge</h1>
            </div>
            <div className="rounded-3xl border border-sahara-border/40 bg-white p-8 shadow-ambient md:p-10">
              <div className="mb-10 text-center">
                <h3 className="mb-2 font-serif text-3xl text-sahara-fg">Welcome Back</h3>
                <p className="text-sm text-sahara-muted">
                  {role === "patient" ? "Please enter your patient credentials." : "Medical professional portal."}
                </p>
              </div>

              {error ? (
                <div className="mb-6 rounded-xl border border-red-300/30 bg-red-100/40 p-4 text-sm text-red-900">
                  {error}
                </div>
              ) : null}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label
                    className="mb-2 block text-xs font-bold uppercase tracking-widest text-sahara-muted"
                    htmlFor="role"
                  >
                    I am signing in as
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full rounded-xl border border-sahara-border/60 bg-sahara-bg px-4 py-3 text-sm text-sahara-fg outline-none transition-all focus:border-sahara-primary focus:ring-1 focus:ring-sahara-primary"
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                  </select>
                </div>

                <label className="block" htmlFor="email">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-sahara-muted">
                    Email Address
                  </span>
                  <input
                    id="email"
                    className="w-full rounded-xl border border-sahara-border/60 bg-sahara-bg px-4 py-3 text-sahara-fg outline-none transition-all placeholder:text-sahara-muted/60 focus:border-sahara-primary focus:ring-1 focus:ring-sahara-primary"
                    placeholder="name@example.com"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-sahara-muted">Password</span>
                    <button
                      className="text-xs font-semibold text-sahara-primary hover:underline"
                      type="button"
                      onClick={() => setModal("forgot")}
                    >
                      Forgot Password?
                    </button>
                  </span>
                  <span className="relative block">
                    <input
                      className="w-full rounded-xl border border-sahara-border/60 bg-sahara-bg px-4 py-3 pr-12 text-sahara-fg outline-none transition-all placeholder:text-sahara-muted/60 focus:border-sahara-primary focus:ring-1 focus:ring-sahara-primary"
                      placeholder="Password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sahara-muted/60 hover:text-sahara-primary"
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </span>
                </label>

                <button
                  className="w-full rounded-xl bg-sahara-primary py-4 font-bold tracking-wide text-white shadow-lg shadow-sahara-primary/10 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : `Continue as ${role}`}
                </button>
              </form>

              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-sahara-border/60" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-4 font-medium uppercase tracking-widest text-sahara-muted">
                    Or continue with
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-sahara-border bg-white px-4 py-3.5 transition-all duration-300 hover:bg-sahara-surface-low disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 0 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-sm font-semibold text-sahara-fg">
                  {isGoogleLoading ? "Redirecting to Google..." : "Continue with Google"}
                </span>
              </button>
              <p className="mt-3 text-center text-xs text-sahara-muted">
                Redirect URI: <span className="font-mono">{callbackUriPreview}</span>
              </p>
              {googleError && (
                <p className="mt-2 text-center text-sm text-red-600" role="alert">
                  {googleError}
                </p>
              )}

              <div className="mt-10 text-center">
                <p className="text-sm text-sahara-muted">
                  New to MedBridge AI?
                  <button
                    type="button"
                    className="ml-1 font-bold text-sahara-primary hover:underline"
                    onClick={() => setModal("signup")}
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </div>

            <footer className="mt-8 flex justify-center gap-6">
              <button
                className="text-[10px] font-bold uppercase tracking-widest text-sahara-muted/60 hover:text-sahara-primary"
                type="button"
                onClick={() => setModal("privacy")}
              >
                Privacy Policy
              </button>
              <button
                className="text-[10px] font-bold uppercase tracking-widest text-sahara-muted/60 hover:text-sahara-primary"
                type="button"
                onClick={() => setModal("terms")}
              >
                Terms of Service
              </button>
              <button
                className="text-[10px] font-bold uppercase tracking-widest text-sahara-muted/60 hover:text-sahara-primary"
                type="button"
                onClick={() => setModal("help")}
              >
                Help Center
              </button>
            </footer>

            <div className="mt-10 text-center">
              <Link className="text-xs text-sahara-muted hover:text-sahara-primary" href="/">
                Back to Welcome
              </Link>
            </div>
          </div>
        </section>
      </div>

      {activeModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-sahara-border bg-white p-8 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <h3 className="font-serif text-2xl">{activeModal.title}</h3>
              <button type="button" onClick={() => setModal(null)} className="text-sahara-muted hover:text-sahara-primary">
                <X className="size-5" />
              </button>
            </div>
            <p className="text-sm leading-6 text-sahara-muted">{activeModal.content}</p>
            <div className="mt-6 grid gap-3">
              {modal === "signup" ? (
                <>
                  <Link href="/onboarding" className="rounded-xl bg-sahara-primary px-4 py-3 text-center text-sm font-bold text-white">
                    Start Patient Onboarding
                  </Link>
                  <Link href="/provider/verification" className="rounded-xl border border-sahara-border px-4 py-3 text-center text-sm font-bold">
                    Verify as Provider
                  </Link>
                </>
              ) : null}
              <button type="button" onClick={() => setModal(null)} className="rounded-xl bg-sahara-surface-low px-4 py-3 text-sm font-bold">
                Understood
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
