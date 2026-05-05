"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, UserRound, ArrowRight } from "lucide-react";

type Role = "patient" | "doctor";
type State = "idle" | "saving" | "error";

export default function RoleSelectionPage() {
  const router = useRouter();
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  async function selectRole(role: Role) {
    setState("saving");
    setError(null);

    try {
      const res = await fetch("/api/onboarding/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ role }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to save your role. Please try again.");
        setState("error");
        return;
      }

      // Role saved in DB — redirect to unified onboarding page
      router.replace("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
      setState("error");
    }
  }

  const saving = state === "saving";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sahara-bg px-4 py-16">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-sahara-primary">
            Step 1 of 2
          </p>
          <h1 className="font-serif text-4xl font-light tracking-tight text-sahara-fg md:text-5xl">
            How will you use MedBridge?
          </h1>
          <p className="mt-4 text-sahara-muted">
            Choose your role. This determines your dashboard and the tools you have access to.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-300/40 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Role cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Patient */}
          <button
            id="role-patient-btn"
            type="button"
            disabled={saving}
            onClick={() => selectRole("patient")}
            className="group relative flex flex-col items-center rounded-2xl border-2 border-sahara-border/60 bg-white p-8 text-center shadow-sm transition-all hover:border-sahara-primary hover:shadow-lg hover:shadow-sahara-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-sahara-primary/10 text-sahara-primary transition-colors group-hover:bg-sahara-primary group-hover:text-white">
              <UserRound className="size-8" />
            </div>
            <h2 className="font-serif text-2xl font-light text-sahara-fg">Patient</h2>
            <p className="mt-2 text-sm text-sahara-muted">
              Access your health records, book appointments, and use AI symptom checking.
            </p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sahara-primary">
              Continue as Patient <ArrowRight className="size-3.5" />
            </span>
          </button>

          {/* Doctor */}
          <button
            id="role-doctor-btn"
            type="button"
            disabled={saving}
            onClick={() => selectRole("doctor")}
            className="group relative flex flex-col items-center rounded-2xl border-2 border-sahara-border/60 bg-white p-8 text-center shadow-sm transition-all hover:border-sahara-primary hover:shadow-lg hover:shadow-sahara-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-sahara-primary/10 text-sahara-primary transition-colors group-hover:bg-sahara-primary group-hover:text-white">
              <Stethoscope className="size-8" />
            </div>
            <h2 className="font-serif text-2xl font-light text-sahara-fg">Doctor</h2>
            <p className="mt-2 text-sm text-sahara-muted">
              Manage your patient roster, review clinical data, and use AI-assisted tools.
            </p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sahara-primary">
              Continue as Doctor <ArrowRight className="size-3.5" />
            </span>
          </button>
        </div>

        {saving && (
          <p className="mt-6 text-center text-sm text-sahara-muted">Saving your role…</p>
        )}

        <p className="mt-10 text-center text-xs text-sahara-muted">
          You can contact support if you need to change your role later.
        </p>
      </div>
    </div>
  );
}
