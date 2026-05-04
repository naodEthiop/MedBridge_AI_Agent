"use client";

import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { triggerUiAction } from "@/lib/apiClient";

type UserRole = "patient" | "doctor" | null;

function PatientOnboarding() {
  const summary = useDashboardSummary();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <AppShell title="Patient Profile Setup" subtitle="Complete your profile to personalize MedBridge AI care guidance">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-12">
        <aside className="space-y-4 rounded-2xl border border-white/30 bg-white/60 p-6 shadow-xl backdrop-blur-md lg:col-span-4">
          <h2 className="font-serif text-2xl text-sahara-fg">Profile completion</h2>
          <p className="text-sm text-sahara-muted">
            Add complete details once so triage, reminders, and risk signals stay accurate and non-redundant.
          </p>
          <div className="space-y-2 rounded-xl border border-sahara-border/40 bg-sahara-surface-low p-4">
            <Shield className="size-5 text-sahara-primary" />
            <p className="text-xs text-sahara-muted">
              Protected with encryption at rest and in transit. Used only for your care workflow.
            </p>
          </div>
        </aside>

        <section className="lg:col-span-8">
          <form className="space-y-8 rounded-2xl border border-white/30 bg-white/70 p-8 shadow-2xl backdrop-blur-lg">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-sahara-muted">Full legal name</span>
                <input className="w-full rounded-lg border border-sahara-border bg-white px-4 py-3" placeholder="Enter full name" />
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-sahara-muted">Date of birth</span>
                <input type="date" className="w-full rounded-lg border border-sahara-border bg-white px-4 py-3" />
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-sahara-muted">Sex</span>
                <select className="w-full rounded-lg border border-sahara-border bg-white px-4 py-3">
                  <option>Female</option>
                  <option>Male</option>
                  <option>Intersex</option>
                  <option>Prefer not to say</option>
                </select>
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-sahara-muted">Mobile phone</span>
                <input className="w-full rounded-lg border border-sahara-border bg-white px-4 py-3" placeholder="+1" />
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-sahara-muted">Emergency contact</span>
                <input className="w-full rounded-lg border border-sahara-border bg-white px-4 py-3" placeholder="Name and relation" />
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-sahara-muted">Height (cm)</span>
                <input type="number" className="w-full rounded-lg border border-sahara-border bg-white px-4 py-3" placeholder="170" />
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-sahara-muted">Weight (kg)</span>
                <input type="number" className="w-full rounded-lg border border-sahara-border bg-white px-4 py-3" placeholder="70" />
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-sahara-muted">Blood type</span>
                <select className="w-full rounded-lg border border-sahara-border bg-white px-4 py-3">
                  <option>Unknown</option>
                  <option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                </select>
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-sahara-muted">Primary language</span>
                <input className="w-full rounded-lg border border-sahara-border bg-white px-4 py-3" placeholder="English" />
              </label>
              <label className="md:col-span-2">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-sahara-muted">Allergies and medication alerts</span>
                <textarea className="w-full rounded-lg border border-sahara-border bg-white px-4 py-3" rows={3} placeholder="Penicillin allergy, latex sensitivity, current anticoagulants..." />
              </label>
              <label className="md:col-span-2">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-sahara-muted">Chronic conditions and surgical history</span>
                <textarea className="w-full rounded-lg border border-sahara-border bg-white px-4 py-3" rows={3} placeholder="Diabetes type 2, hypertension, appendectomy 2019..." />
              </label>
            </div>

            <div className="flex flex-col gap-4 border-t border-sahara-border/40 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-sahara-muted">This is a single comprehensive form to avoid repeated onboarding questions later.</p>
              <button
                type="button"
                onClick={() => {
                  setSaving(true);
                  setFeedback(null);
                  triggerUiAction("onboarding_complete")
                    .then((res) => {
                      setFeedback(res.ok ? (res.data.message ?? "Profile saved successfully.") : "Unable to save profile right now.");
                    })
                    .finally(() => setSaving(false));
                }}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-sahara-primary px-8 py-3 font-semibold text-white"
              >
                {saving ? "Saving..." : "Save and continue"}
                <ArrowRight className="size-4" />
              </button>
            </div>
            {feedback ? <p className="text-sm text-emerald-700">{feedback}</p> : null}
          </form>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/patient" className="rounded-full bg-sahara-primary px-6 py-3 text-center text-sm font-semibold text-white">
              Open patient dashboard ({summary.patientCount} patients)
            </Link>
            <Link href="/doctor" className="rounded-full bg-sahara-surface-low px-6 py-3 text-center text-sm font-semibold ring-1 ring-sahara-border/60">
              Open doctor dashboard ({summary.doctorCount} doctors)
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function DoctorOnboarding() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <AppShell title="Doctor Profile Setup" subtitle="Complete your credentials to access the physician dashboard">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-12">
        <aside className="space-y-4 rounded-2xl border border-white/30 bg-white/60 p-6 shadow-xl backdrop-blur-md lg:col-span-4">
          <h2 className="font-serif text-2xl text-sahara-fg">Credentials verification</h2>
          <p className="text-sm text-sahara-muted">
            Verify your professional credentials to activate your clinician dashboard and access patient management tools.
          </p>
          <div className="space-y-2 rounded-xl border border-sahara-border/40 bg-sahara-surface-low p-4">
            <Shield className="size-5 text-sahara-primary" />
            <p className="text-xs text-sahara-muted">
              Your credentials are verified and securely stored. Required for compliance and patient trust.
            </p>
          </div>
        </aside>

        <section className="lg:col-span-8">
          <form className="space-y-8 rounded-2xl border border-white/30 bg-white/70 p-8 shadow-2xl backdrop-blur-lg">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-sahara-muted">Full legal name</span>
                <input className="w-full rounded-lg border border-sahara-border bg-white px-4 py-3" placeholder="Enter full name" />
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-sahara-muted">Medical specialty</span>
                <input className="w-full rounded-lg border border-sahara-border bg-white px-4 py-3" placeholder="e.g., Cardiology, General Practice" />
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-sahara-muted">Years of experience</span>
                <input type="number" className="w-full rounded-lg border border-sahara-border bg-white px-4 py-3" placeholder="15" />
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-sahara-muted">License number</span>
                <input className="w-full rounded-lg border border-sahara-border bg-white px-4 py-3" placeholder="Medical license ID" />
              </label>
              <label className="md:col-span-2">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-sahara-muted">Hospital or clinic name</span>
                <input className="w-full rounded-lg border border-sahara-border bg-white px-4 py-3" placeholder="Your primary practice location" />
              </label>
            </div>

            <div className="flex flex-col gap-4 border-t border-sahara-border/40 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-sahara-muted">Your information helps patients identify and connect with verified clinicians.</p>
              <button
                type="button"
                onClick={() => {
                  setSaving(true);
                  setFeedback(null);
                  triggerUiAction("onboarding_complete")
                    .then((res) => {
                      setFeedback(res.ok ? (res.data.message ?? "Profile saved successfully.") : "Unable to save profile right now.");
                    })
                    .finally(() => setSaving(false));
                }}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-sahara-primary px-8 py-3 font-semibold text-white"
              >
                {saving ? "Saving..." : "Activate dashboard"}
                <ArrowRight className="size-4" />
              </button>
            </div>
            {feedback ? <p className="text-sm text-emerald-700">{feedback}</p> : null}
          </form>

          <div className="mt-6">
            <Link href="/doctor/dashboard" className="inline-block rounded-full bg-sahara-primary px-6 py-3 text-center text-sm font-semibold text-white">
              Open doctor dashboard
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.role) {
          setUserRole(data.role);
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <AppShell title="Loading" subtitle="">
        <div className="mx-auto max-w-4xl text-center py-12">
          <p className="text-sahara-muted">Setting up your profile...</p>
        </div>
      </AppShell>
    );
  }

  return userRole === "doctor" ? <DoctorOnboarding /> : <PatientOnboarding />;
}
