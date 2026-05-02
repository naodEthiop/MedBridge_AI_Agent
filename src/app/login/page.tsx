"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, X } from "lucide-react";
import { FormEvent, useState } from "react";

type Role = "patient" | "doctor";
type ModalKind = "forgot" | "signup" | "privacy" | "terms" | "help" | null;

const modalCopy: Record<Exclude<ModalKind, null>, { title: string; content: string }> = {
  forgot: {
    title: "Reset Password",
    content: "Enter your registered email, then continue. A reset link will be sent by the auth service when it is connected.",
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
  const [role, setRole] = useState<Role>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);

  const destination = role === "doctor" ? "/doctor/dashboard" : "/patient";

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
    router.push(destination);
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    router.push(destination);
  }

  const activeModal = modal ? modalCopy[modal] : null;

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

              <div className="mb-8 flex rounded-xl bg-sahara-surface-low p-1">
                {(["patient", "doctor"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRole(item)}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-all duration-300 ${
                      role === item ? "bg-white text-sahara-primary shadow-sm" : "text-sahara-muted hover:text-sahara-fg"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {error ? (
                <div className="mb-6 rounded-xl border border-red-300/30 bg-red-100/40 p-4 text-sm text-red-900">
                  {error}
                </div>
              ) : null}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-sahara-muted">
                    Email Address
                  </span>
                  <input
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
                disabled={googleLoading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-sahara-border bg-white px-4 py-3.5 transition-all duration-300 hover:bg-sahara-surface-low disabled:opacity-60"
              >
                <span className="text-sm font-semibold text-sahara-fg">
                  {googleLoading ? "Connecting to Google..." : "Continue with Google"}
                </span>
              </button>

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
              <button className="text-[10px] font-bold uppercase tracking-widest text-sahara-muted/60 hover:text-sahara-primary" type="button" onClick={() => setModal("privacy")}>
                Privacy Policy
              </button>
              <button className="text-[10px] font-bold uppercase tracking-widest text-sahara-muted/60 hover:text-sahara-primary" type="button" onClick={() => setModal("terms")}>
                Terms of Service
              </button>
              <button className="text-[10px] font-bold uppercase tracking-widest text-sahara-muted/60 hover:text-sahara-primary" type="button" onClick={() => setModal("help")}>
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
