"use client";

import Link from "next/link";
<<<<<<< HEAD
=======
import { Eye, EyeOff, ShieldCheck, X } from "lucide-react";
import { FormEvent, Suspense, useEffect, useState } from "react";
>>>>>>> 55794be (refactor: remove middleware and enhance auth pages with Suspense)
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  HeartPulse,
  Lock,
  Mail,
  Menu,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { FormEvent, Suspense, useEffect, useState } from "react";

type Role = "patient" | "doctor";
type AuthTab = "login" | "signup";
type ModalKind = "forgot" | "privacy" | "terms" | "help" | null;

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"] as const;

const modalCopy: Record<Exclude<ModalKind, null>, { title: string; content: string }> = {
  forgot: {
    title: "Reset Password",
    content:
      "Enter your registered email on the sign-in form, then contact your administrator or use your organization’s SSO reset flow when connected.",
  },
  privacy: {
    title: "Privacy Policy",
    content:
      "MedBridge processes health data only for care coordination and verified clinical workflows. Data is encrypted in transit and access is role-restricted.",
  },
  terms: {
    title: "Terms of Service",
    content:
      "MedBridge provides decision support and coordination tools. Licensed clinicians remain responsible for diagnosis and treatment decisions.",
  },
  help: {
    title: "Help Center",
    content: "Patients can continue to the dashboard after sign-in. Clinical staff can use the AI assistant from the doctor portal.",
  },
};

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const expired = searchParams.get("expired");

  const [authTab, setAuthTab] = useState<AuthTab>("login");
  const [role, setRole] = useState<Role>("patient");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"female" | "male" | "other">("male");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [bloodType, setBloodType] = useState<string>("O+");

  const [specialty, setSpecialty] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [clinicName, setClinicName] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(expired ? "Your session expired. Please sign in again." : null);
  const [modal, setModal] = useState<ModalKind>(null);

  useEffect(() => {
    if (searchParams.get("google") === "unavailable") {
      setError(
        "Google sign-in needs Supabase: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then enable the Google provider in Supabase Auth. You can still use email and password.",
      );
    } else if (searchParams.get("error") === "oauth") {
      setError("Google sign-in was cancelled or could not complete. Please try again.");
    } else if (searchParams.get("error") === "sync") {
      setError("Google sign-in worked, but syncing your MedBridge session failed. Try again or use email login.");
    }
  }, [searchParams]);

  async function handleGoogleLogin() {
    setError(null);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      setError(
        "Google sign-in requires Supabase. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, enable Google in Supabase Auth, then try again.",
      );
      return;
    }
    setGoogleLoading(true);
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(url, anon, {
        auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true },
      });
      const nextQ = nextPath && nextPath.startsWith("/") ? `?next=${encodeURIComponent(nextPath)}` : "";
      const redirectTo = `${window.location.origin}/auth/callback${nextQ}`;
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (oauthError) {
        setError(oauthError.message);
        return;
      }
      if (data.url) {
        window.location.assign(data.url);
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  function redirectForUser(r: Role) {
    if (nextPath && nextPath.startsWith("/")) {
      router.push(nextPath);
      return;
    }
    router.push(r === "doctor" ? "/doctor/dashboard" : "/patient");
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await res.json()) as { error?: string; user?: { role: Role } };
      if (!res.ok) {
        setError(data.error ?? "Sign-in failed.");
        return;
      }
      if (data.user?.role) redirectForUser(data.user.role);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const body =
        role === "patient"
          ? {
              role: "patient" as const,
              email: email.trim(),
              password,
              confirmPassword,
              patient: {
                fullName: fullName.trim(),
                age: Number(age),
                sex,
                heightCm: Number(heightCm),
                weightKg: Number(weightKg),
                bloodType,
              },
            }
          : {
              role: "doctor" as const,
              email: email.trim(),
              password,
              confirmPassword,
              doctor: {
                fullName: fullName.trim(),
                specialty: specialty.trim(),
                experienceYears: Number(experienceYears),
                clinicName: clinicName.trim(),
              },
            };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string; user?: { role: Role } };
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }
      if (data.user?.role) redirectForUser(data.user.role);
    } finally {
      setLoading(false);
    }
  }

  const activeModal = modal ? modalCopy[modal] : null;

  return (
    <div className="flex min-h-screen flex-col bg-sahara-bg text-sahara-fg">
      <header className="sticky top-0 z-40 border-b border-sahara-border/60 bg-sahara-bg/95 shadow-ambient backdrop-blur-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12">
          <Link href="/" className="font-serif text-2xl italic text-sahara-primary">
            MedBridge
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <button
              type="button"
              onClick={() => setModal("help")}
              className="text-sm font-semibold tracking-wide text-sahara-muted transition-colors hover:text-sahara-primary"
            >
              Support
            </button>
            <Link
              href="/provider/verification"
              className="text-sm font-semibold tracking-wide text-sahara-muted transition-colors hover:text-sahara-primary"
            >
              Resources
            </Link>
            <a
              href="mailto:support@medbridge.ai"
              className="rounded-lg bg-sahara-primary px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Contact Us
            </a>
          </div>
          <button
            type="button"
            className="text-sahara-primary md:hidden"
            aria-label="Open menu"
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            <Menu className="size-6" />
          </button>
        </nav>
        {mobileNavOpen ? (
          <div className="border-t border-sahara-border/60 bg-sahara-bg px-6 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              <button type="button" className="text-left text-sm font-semibold text-sahara-muted" onClick={() => setModal("help")}>
                Support
              </button>
              <Link href="/provider/verification" className="text-sm font-semibold text-sahara-muted">
                Resources
              </Link>
              <a href="mailto:support@medbridge.ai" className="text-sm font-semibold text-sahara-primary">
                Contact Us
              </a>
            </div>
          </div>
        ) : null}
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12 md:py-20">
        <div className="pointer-events-none absolute -right-[5%] top-[-10%] size-96 rounded-full bg-sahara-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-10%] left-[-5%] size-80 rounded-full bg-sahara-tertiary/5 blur-3xl" />

        <div className="relative z-10 w-full max-w-xl">
          <div className="rounded-2xl border border-sahara-border/40 bg-sahara-card p-8 shadow-ambient md:p-12">
            <div className="mb-10 text-center">
              <h1 className="mb-2 font-serif text-4xl font-light tracking-tight text-sahara-fg md:text-5xl">
                {authTab === "login" ? "Welcome Back" : "Create Your Account"}
              </h1>
              <p className="text-sm tracking-wide text-sahara-muted">
                {authTab === "login"
                  ? "Enter your credentials to access your clinical dashboard."
                  : "Register with your role. Patient profiles include vitals for your health record."}
              </p>
            </div>

            <div className="mb-8 flex border-b border-sahara-border/80">
              <button
                type="button"
                onClick={() => {
                  setAuthTab("login");
                  setError(null);
                }}
                className={`flex-1 pb-4 text-sm font-semibold tracking-wide transition-colors ${
                  authTab === "login"
                    ? "border-b-2 border-sahara-primary text-sahara-primary"
                    : "text-sahara-muted hover:text-sahara-fg"
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab("signup");
                  setError(null);
                }}
                className={`flex-1 pb-4 text-sm font-semibold tracking-wide transition-colors ${
                  authTab === "signup"
                    ? "border-b-2 border-sahara-primary text-sahara-primary"
                    : "text-sahara-muted hover:text-sahara-fg"
                }`}
              >
                Sign Up
              </button>
            </div>

            {error ? (
              <div className="mb-6 rounded-xl border border-red-300/40 bg-red-100/35 p-4 text-sm text-red-900">{error}</div>
            ) : null}

            {authTab === "login" ? (
              <>
                <form className="space-y-6" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <label className="ml-1 block text-xs font-bold uppercase tracking-widest text-sahara-muted">Email Address</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-sahara-muted/70" />
                      <input
                        className="w-full rounded-xl border border-sahara-border/80 bg-white py-3 pl-12 pr-4 text-sahara-fg outline-none transition-all placeholder:text-sahara-muted/50 focus:border-sahara-primary focus:ring-2 focus:ring-sahara-primary/20"
                        placeholder="you@medbridge.ai"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <label className="block text-xs font-bold uppercase tracking-widest text-sahara-muted">Password</label>
                      <button type="button" className="text-xs font-semibold text-sahara-primary hover:underline" onClick={() => setModal("forgot")}>
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-sahara-muted/70" />
                      <input
                        className="w-full rounded-xl border border-sahara-border/80 bg-white py-3 pl-12 pr-4 text-sahara-fg outline-none transition-all placeholder:text-sahara-muted/50 focus:border-sahara-primary focus:ring-2 focus:ring-sahara-primary/20"
                        placeholder="••••••••"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || googleLoading}
                    className="w-full rounded-xl bg-sahara-primary py-4 text-sm font-bold uppercase tracking-widest text-white shadow-md shadow-sahara-primary/10 transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
                  >
                    {loading ? "Signing in..." : "Log In"}
                  </button>
                </form>

                <div className="mt-8 flex items-center gap-4">
                  <div className="h-px flex-1 bg-sahara-border/60" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sahara-muted">Or continue with</span>
                  <div className="h-px flex-1 bg-sahara-border/60" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading || googleLoading}
                  className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-sahara-border/80 bg-white py-3.5 text-sm font-semibold text-sahara-fg shadow-sm transition-all hover:bg-sahara-surface-low disabled:opacity-60"
                >
                  <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
                </button>
              </>
            ) : null}

            {authTab === "signup" ? (
              <form className="space-y-6" onSubmit={handleRegister}>
                <div>
                  <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-sahara-muted">Join as</p>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole("patient")}
                      className={`flex flex-col items-center rounded-2xl border p-6 transition-all ${
                        role === "patient"
                          ? "border-sahara-primary bg-sahara-primary/5 shadow-lg shadow-sahara-primary/5"
                          : "border-sahara-border/80 hover:border-sahara-primary/40"
                      }`}
                    >
                      <div
                        className={`mb-3 flex size-12 items-center justify-center rounded-full ${
                          role === "patient" ? "bg-sahara-primary text-white" : "bg-sahara-surface-low text-sahara-muted"
                        }`}
                      >
                        <UserRound className="size-6" />
                      </div>
                      <span
                        className={`text-xs font-bold uppercase tracking-widest ${
                          role === "patient" ? "text-sahara-primary" : "text-sahara-muted"
                        }`}
                      >
                        Patient
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("doctor")}
                      className={`flex flex-col items-center rounded-2xl border p-6 transition-all ${
                        role === "doctor"
                          ? "border-sahara-primary bg-sahara-primary/5 shadow-lg shadow-sahara-primary/5"
                          : "border-sahara-border/80 hover:border-sahara-primary/40"
                      }`}
                    >
                      <div
                        className={`mb-3 flex size-12 items-center justify-center rounded-full ${
                          role === "doctor" ? "bg-sahara-primary text-white" : "bg-sahara-surface-low text-sahara-muted"
                        }`}
                      >
                        <Stethoscope className="size-6" />
                      </div>
                      <span
                        className={`text-xs font-bold uppercase tracking-widest ${
                          role === "doctor" ? "text-sahara-primary" : "text-sahara-muted"
                        }`}
                      >
                        Doctor
                      </span>
                    </button>
                  </div>
                </div>

                {role === "patient" ? (
                  <div className="space-y-4 rounded-2xl border border-sahara-border/50 bg-sahara-surface-low/50 p-5">
                    <h2 className="font-serif text-xl font-light text-sahara-fg">Patient profile</h2>
                    <p className="text-xs text-sahara-muted">Demographics and vitals for your digital health record.</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2 sm:col-span-2">
                        <span className="ml-1 block text-xs font-bold uppercase tracking-widest text-sahara-muted">Full name</span>
                        <input
                          className="w-full rounded-xl border border-sahara-border/80 bg-white px-4 py-3 text-sm outline-none focus:border-sahara-primary"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Jordan Lee"
                          required
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="ml-1 block text-xs font-bold uppercase tracking-widest text-sahara-muted">Age</span>
                        <input
                          className="w-full rounded-xl border border-sahara-border/80 bg-white px-4 py-3 text-sm outline-none focus:border-sahara-primary"
                          type="number"
                          min={1}
                          max={130}
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          required
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="ml-1 block text-xs font-bold uppercase tracking-widest text-sahara-muted">Sex</span>
                        <select
                          className="w-full rounded-xl border border-sahara-border/80 bg-white px-4 py-3 text-sm outline-none focus:border-sahara-primary"
                          value={sex}
                          onChange={(e) => setSex(e.target.value as "female" | "male" | "other")}
                        >
                          <option value="female">Female</option>
                          <option value="male">Male</option>
                          <option value="other">Other</option>
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="ml-1 block text-xs font-bold uppercase tracking-widest text-sahara-muted">Height (cm)</span>
                        <input
                          className="w-full rounded-xl border border-sahara-border/80 bg-white px-4 py-3 text-sm outline-none focus:border-sahara-primary"
                          type="number"
                          min={50}
                          max={280}
                          value={heightCm}
                          onChange={(e) => setHeightCm(e.target.value)}
                          required
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="ml-1 block text-xs font-bold uppercase tracking-widest text-sahara-muted">Weight (kg)</span>
                        <input
                          className="w-full rounded-xl border border-sahara-border/80 bg-white px-4 py-3 text-sm outline-none focus:border-sahara-primary"
                          type="number"
                          min={15}
                          max={400}
                          value={weightKg}
                          onChange={(e) => setWeightKg(e.target.value)}
                          required
                        />
                      </label>
                      <label className="space-y-2 sm:col-span-2">
                        <span className="ml-1 block text-xs font-bold uppercase tracking-widest text-sahara-muted">Blood type</span>
                        <select
                          className="w-full rounded-xl border border-sahara-border/80 bg-white px-4 py-3 text-sm outline-none focus:border-sahara-primary"
                          value={bloodType}
                          onChange={(e) => setBloodType(e.target.value)}
                        >
                          {BLOOD_TYPES.map((bt) => (
                            <option key={bt} value={bt}>
                              {bt}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 rounded-2xl border border-sahara-border/50 bg-sahara-surface-low/50 p-5">
                    <h2 className="font-serif text-xl font-light text-sahara-fg">Professional profile</h2>
                    <p className="text-xs text-sahara-muted">Tell us about your medical practice.</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2 sm:col-span-2">
                        <span className="ml-1 block text-xs font-bold uppercase tracking-widest text-sahara-muted">Full name</span>
                        <input
                          className="w-full rounded-xl border border-sahara-border/80 bg-white px-4 py-3 text-sm outline-none focus:border-sahara-primary"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Dr. Julianne Vane"
                          required
                        />
                      </label>
                      <label className="space-y-2 sm:col-span-2">
                        <span className="ml-1 block text-xs font-bold uppercase tracking-widest text-sahara-muted">Specialty</span>
                        <input
                          className="w-full rounded-xl border border-sahara-border/80 bg-white px-4 py-3 text-sm outline-none focus:border-sahara-primary"
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          placeholder="Neurology"
                          required
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="ml-1 block text-xs font-bold uppercase tracking-widest text-sahara-muted">Experience (years)</span>
                        <input
                          className="w-full rounded-xl border border-sahara-border/80 bg-white px-4 py-3 text-sm outline-none focus:border-sahara-primary"
                          type="number"
                          min={0}
                          max={80}
                          value={experienceYears}
                          onChange={(e) => setExperienceYears(e.target.value)}
                          required
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="ml-1 block text-xs font-bold uppercase tracking-widest text-sahara-muted">Clinic name</span>
                        <input
                          className="w-full rounded-xl border border-sahara-border/80 bg-white px-4 py-3 text-sm outline-none focus:border-sahara-primary"
                          value={clinicName}
                          onChange={(e) => setClinicName(e.target.value)}
                          placeholder={"St. Mary's General"}
                          required
                        />
                      </label>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="ml-1 block text-xs font-bold uppercase tracking-widest text-sahara-muted">Email Address</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-sahara-muted/70" />
                    <input
                      className="w-full rounded-xl border border-sahara-border/80 bg-white py-3 pl-12 pr-4 text-sahara-fg outline-none transition-all focus:border-sahara-primary focus:ring-2 focus:ring-sahara-primary/20"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="ml-1 block text-xs font-bold uppercase tracking-widest text-sahara-muted">Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-sahara-muted/70" />
                    <input
                      className="w-full rounded-xl border border-sahara-border/80 bg-white py-3 pl-12 pr-4 text-sahara-fg outline-none transition-all focus:border-sahara-primary focus:ring-2 focus:ring-sahara-primary/20"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="ml-1 block text-xs font-bold uppercase tracking-widest text-sahara-muted">Confirm password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-sahara-muted/70" />
                    <input
                      className="w-full rounded-xl border border-sahara-border/80 bg-white py-3 pl-12 pr-4 text-sahara-fg outline-none transition-all focus:border-sahara-primary focus:ring-2 focus:ring-sahara-primary/20"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-sahara-fg py-4 text-sm font-bold uppercase tracking-widest text-sahara-bg transition-all hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? "Creating account..." : "Complete enrollment"}
                  <ArrowRight className="size-4" />
                </button>
              </form>
            ) : null}

            {authTab === "login" ? (
              <p className="mt-8 text-center text-xs text-sahara-muted">
                New to MedBridge?{" "}
                <button type="button" className="font-bold text-sahara-primary hover:underline" onClick={() => setAuthTab("signup")}>
                  Create an account
                </button>
              </p>
            ) : null}
          </div>

          <div className="mt-12 overflow-hidden rounded-2xl border border-sahara-border/40 shadow-ambient">
            <div className="relative h-64 w-full">
              <img
                alt="Warm, professional care environment"
                className="absolute inset-0 size-full object-cover transition-transform duration-700 hover:scale-105"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJkNoyV112hwP8KOIiNc_E0pDZiuIheTpeXPQz-f8qtSEm2Z5W86jR90OE0eKKm-i0JKnFu2VAwLb2sSSL5Gfjmd6igmjn_ya76bUYjl-ziS5LASd1CyZl-7pp0fRGCoKASclYdVU7TDG3GmB617OBAhS9Y01o3PZQVnMouyfeeQ8pU2hPRtzpZg8JbKxYpyW_zNbYdEhUVTNzZT_PWt6huTldsrKTidaWR9sabXZF5NK4KjCvOIiHVdsM3s3dJhQkxhD5HIkFk1Q"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-sahara-fg/80 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-8">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-sahara-primary-2">Our mission</p>
                <h3 className="font-serif text-2xl font-light tracking-wide text-white">
                  Bridging the gap between AI and human care.
                </h3>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-sahara-muted">
            <Link href="/" className="font-semibold text-sahara-primary hover:underline">
              Back to welcome
            </Link>
            <span className="mx-2 text-sahara-border">·</span>
            <span className="inline-flex items-center gap-1">
              <HeartPulse className="size-3.5 text-sahara-tertiary" />
              Role-based routing after sign-in
            </span>
          </p>
        </div>
      </main>

      <footer className="mt-auto border-t border-sahara-border/60 bg-sahara-bg py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-8 md:flex-row">
          <div className="text-xs uppercase tracking-widest text-sahara-muted">© {new Date().getFullYear()} MedBridge Healthcare AI</div>
          <div className="flex flex-wrap justify-center gap-8">
            <button type="button" className="text-xs uppercase tracking-widest text-sahara-muted hover:text-sahara-fg" onClick={() => setModal("privacy")}>
              Privacy Policy
            </button>
            <button type="button" className="text-xs uppercase tracking-widest text-sahara-muted hover:text-sahara-fg" onClick={() => setModal("terms")}>
              Terms of Service
            </button>
            <span className="text-xs uppercase tracking-widest text-sahara-muted">HIPAA-minded design</span>
          </div>
        </div>
      </footer>

      {activeModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-sahara-border bg-white p-8 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <h3 className="font-serif text-2xl">{activeModal.title}</h3>
              <button type="button" onClick={() => setModal(null)} className="text-sahara-muted hover:text-sahara-primary" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            <p className="text-sm leading-6 text-sahara-muted">{activeModal.content}</p>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="mt-6 w-full rounded-xl bg-sahara-surface-low px-4 py-3 text-sm font-bold text-sahara-fg"
            >
              Understood
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-sahara-bg font-serif text-sahara-muted">Loading…</div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-sahara-bg text-sahara-fg">
          <p className="text-sm text-sahara-muted">Loading...</p>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
