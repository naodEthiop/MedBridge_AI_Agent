"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Shield } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { triggerUiAction } from "@/lib/apiClient";

export default function OnboardingPage() {
  const summary = useDashboardSummary();
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <AppShell title="Patient Onboarding" subtitle="Stitch screen: Patient Onboarding">
      <div className="grid gap-12 lg:grid-cols-12">
        <aside className="space-y-8 lg:col-span-4">
          <div>
            <h2 className="font-serif text-3xl">Your Journey</h2>
            <p className="mt-2 text-sm text-sahara-muted">
              Let’s set up your digital profile with sun-baked simplicity.
            </p>
          </div>
          <div className="space-y-6">
            {[
              { step: 1, title: "Personal Details", active: step === 1 },
              { step: 2, title: "Physical Metrics", active: step === 2 },
              { step: 3, title: "Medical History", active: step === 3 },
            ].map((item) => (
              <div key={item.step} className={`flex items-center gap-4 ${item.active ? "" : "opacity-50"}`}>
                <div
                  className={`flex size-10 items-center justify-center rounded-full text-sm font-bold ${
                    item.active ? "bg-sahara-primary text-white" : "border-2 border-sahara-border text-sahara-muted"
                  }`}
                >
                  {item.step}
                </div>
                <div>
                  <p className={`text-sm ${item.active ? "font-bold text-sahara-primary" : "font-medium"}`}>{item.title}</p>
                  <p className="text-xs text-sahara-muted">{item.active ? `Step ${step} of 3` : item.step < step ? "Complete" : "Upcoming"}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3 rounded-xl border border-sahara-border/40 bg-sahara-surface-low p-6">
            <Shield className="size-6 text-sahara-primary" />
            <h4 className="font-serif text-lg">Safe & Encrypted</h4>
            <p className="text-xs text-sahara-muted">
              Your data is protected with enterprise-grade encryption and used only for care.
            </p>
          </div>
        </aside>

        <section className="space-y-8 lg:col-span-8">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-sahara-primary">Step {step}</span>
            <h1 className="font-serif text-5xl">
              {step === 1 ? "Personal Details" : step === 2 ? "Physical Metrics" : "Medical History"}
            </h1>
            <p className="max-w-lg text-sahara-muted">
              Provide basic information so we can customize your health insights and dashboard experience.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl">
            <img
              alt="Healthcare"
              className="h-48 w-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuByjEUWpFkZ1RarTr8q8F-NuYFpU3I-e6f74B603kpjJgK0Fc0usFv-8oRWyDc4kUZJzI7GY5wbAZ0tAB-loCS87FP1YstDwBa8F7PyoTYW4LWBnjglOkTdse9_-77hFNiLLvAHek266-2FbNAkTSshcJTnSrD9JBQdjwE02XWQyZ_rUBNezKNOAPaQBrLdVlT-08oB0-itOP6_bZn8v9o5oSkkPwjBbWVgCWL5W_KjUZsG2YkK5h72Fskz25Fqxna7dfx3kPKsgKg"
            />
          </div>

          <form className="space-y-8 rounded-2xl border border-sahara-border/40 bg-white p-8 shadow-ambient">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-sahara-muted">Full Name</span>
                <input className="w-full rounded-lg border border-sahara-border bg-sahara-surface px-4 py-3" />
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-sahara-muted">Age</span>
                <input className="w-full rounded-lg border border-sahara-border bg-sahara-surface px-4 py-3" type="number" />
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-sahara-muted">Sex at Birth</span>
                <select className="w-full rounded-lg border border-sahara-border bg-sahara-surface px-4 py-3">
                  <option>Select option</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </label>
            </div>

            <div className="flex flex-col items-center justify-between gap-4 border-t border-sahara-border/40 pt-6 md:flex-row">
              <button
                type="button"
                onClick={() => {
                  setFeedback(null);
                  setStep((current) => Math.max(1, current - 1));
                }}
                className="inline-flex items-center gap-2 font-bold text-sahara-muted hover:text-sahara-primary"
              >
                <ArrowLeft className="size-4" />
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (step < 3) {
                    setStep((current) => current + 1);
                    setFeedback(null);
                    return;
                  }
                  setSaving(true);
                  setFeedback(null);
                  triggerUiAction("onboarding_complete")
                    .then((res) => {
                      setFeedback(
                        res.ok
                          ? (res.data.message ?? "Onboarding details saved. Your profile is ready for dashboard review.")
                          : "Unable to save onboarding details right now.",
                      );
                    })
                    .finally(() => setSaving(false));
                }}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-sahara-primary px-10 py-4 font-bold text-white"
              >
                {saving ? "Saving..." : step === 3 ? "Finish" : "Continue"}
                <ArrowRight className="size-4" />
              </button>
            </div>
            {feedback ? <p className="text-sm text-emerald-700">{feedback}</p> : null}
          </form>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-sahara-border/60 bg-sahara-surface-low p-4 opacity-70">
              <p className="text-[10px] font-bold uppercase text-sahara-muted">Coming Up</p>
              <h5 className="font-serif text-sm">Physical Metrics</h5>
            </div>
            <div className="rounded-xl border border-sahara-border/60 bg-sahara-surface-low p-4 opacity-70">
              <p className="text-[10px] font-bold uppercase text-sahara-muted">Final Goal</p>
              <h5 className="font-serif text-sm">Health Card Generation</h5>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/patient"
              className="rounded-full bg-sahara-primary px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-sahara-primary-2"
            >
              Go to patient dashboard ({summary.patientCount} patients)
            </Link>
            <Link
              href="/doctor"
              className="rounded-full bg-sahara-surface-low px-6 py-3 text-center text-sm font-semibold ring-1 ring-sahara-border/60 transition-colors hover:bg-sahara-surface"
            >
              Go to doctor dashboard ({summary.doctorCount} doctors)
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

