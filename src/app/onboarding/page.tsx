"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Shield, Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// ─── Patient Form ─────────────────────────────────────────────────────────────

function PatientForm({ onSuccess }: { onSuccess: (role: string) => void }) {
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"female" | "male" | "other">("male");
  const [phone, setPhone] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          role: "patient",
          fullName: fullName.trim(),
          age: Number(age),
          gender,
          phone: phone.trim(),
          medicalNotes: medicalNotes.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to save your profile. Please try again.");
        setSaving(false);
        return;
      }

      onSuccess("patient");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-300/40 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="block text-xs font-bold uppercase tracking-widest text-sahara-muted">
            Full Name <span className="text-sahara-tertiary">*</span>
          </span>
          <input
            id="patient-fullName"
            className="w-full rounded-xl border border-sahara-border/80 bg-white px-4 py-3 text-sahara-fg outline-none transition-all focus:border-sahara-primary focus:ring-2 focus:ring-sahara-primary/20"
            placeholder="Your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </label>

        <label className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-widest text-sahara-muted">
            Age <span className="text-sahara-tertiary">*</span>
          </span>
          <input
            id="patient-age"
            type="number"
            min={1}
            max={130}
            className="w-full rounded-xl border border-sahara-border/80 bg-white px-4 py-3 text-sahara-fg outline-none transition-all focus:border-sahara-primary focus:ring-2 focus:ring-sahara-primary/20"
            placeholder="25"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />
        </label>

        <label className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-widest text-sahara-muted">
            Gender <span className="text-sahara-tertiary">*</span>
          </span>
          <select
            id="patient-gender"
            className="w-full rounded-xl border border-sahara-border/80 bg-white px-4 py-3 text-sahara-fg outline-none transition-all focus:border-sahara-primary focus:ring-2 focus:ring-sahara-primary/20"
            value={gender}
            onChange={(e) => setGender(e.target.value as "female" | "male" | "other")}
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="block text-xs font-bold uppercase tracking-widest text-sahara-muted">
            Phone Number <span className="text-sahara-tertiary">*</span>
          </span>
          <input
            id="patient-phone"
            type="tel"
            className="w-full rounded-xl border border-sahara-border/80 bg-white px-4 py-3 text-sahara-fg outline-none transition-all focus:border-sahara-primary focus:ring-2 focus:ring-sahara-primary/20"
            placeholder="+1 555 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="block text-xs font-bold uppercase tracking-widest text-sahara-muted">
            Medical Notes{" "}
            <span className="font-normal normal-case tracking-normal text-sahara-muted/60">(optional)</span>
          </span>
          <textarea
            id="patient-medicalNotes"
            rows={3}
            className="w-full rounded-xl border border-sahara-border/80 bg-white px-4 py-3 text-sahara-fg outline-none transition-all focus:border-sahara-primary focus:ring-2 focus:ring-sahara-primary/20"
            placeholder="Existing conditions, allergies, current medications…"
            value={medicalNotes}
            onChange={(e) => setMedicalNotes(e.target.value)}
          />
        </label>
      </div>

      <button
        id="patient-submit-btn"
        type="submit"
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sahara-primary py-4 text-sm font-bold uppercase tracking-widest text-white shadow-md shadow-sahara-primary/10 transition-all hover:opacity-90 disabled:opacity-60"
      >
        {saving ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Saving profile…
          </>
        ) : (
          <>
            Complete & Go to Dashboard <ArrowRight className="size-4" />
          </>
        )}
      </button>
    </form>
  );
}

// ─── Doctor Form ──────────────────────────────────────────────────────────────

function DoctorForm({ onSuccess }: { onSuccess: (role: string) => void }) {
  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [hospital, setHospital] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [licenseId, setLicenseId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          role: "doctor",
          fullName: fullName.trim(),
          specialization: specialization.trim(),
          hospital: hospital.trim(),
          yearsOfExperience: Number(yearsOfExperience),
          licenseId: licenseId.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to save your profile. Please try again.");
        setSaving(false);
        return;
      }

      onSuccess("doctor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-300/40 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="block text-xs font-bold uppercase tracking-widest text-sahara-muted">
            Full Name <span className="text-sahara-tertiary">*</span>
          </span>
          <input
            id="doctor-fullName"
            className="w-full rounded-xl border border-sahara-border/80 bg-white px-4 py-3 text-sahara-fg outline-none transition-all focus:border-sahara-primary focus:ring-2 focus:ring-sahara-primary/20"
            placeholder="Dr. Jane Smith"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="block text-xs font-bold uppercase tracking-widest text-sahara-muted">
            Specialization <span className="text-sahara-tertiary">*</span>
          </span>
          <input
            id="doctor-specialization"
            className="w-full rounded-xl border border-sahara-border/80 bg-white px-4 py-3 text-sahara-fg outline-none transition-all focus:border-sahara-primary focus:ring-2 focus:ring-sahara-primary/20"
            placeholder="e.g. Cardiology, General Practice"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            required
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="block text-xs font-bold uppercase tracking-widest text-sahara-muted">
            Hospital / Clinic <span className="text-sahara-tertiary">*</span>
          </span>
          <input
            id="doctor-hospital"
            className="w-full rounded-xl border border-sahara-border/80 bg-white px-4 py-3 text-sahara-fg outline-none transition-all focus:border-sahara-primary focus:ring-2 focus:ring-sahara-primary/20"
            placeholder="City General Hospital"
            value={hospital}
            onChange={(e) => setHospital(e.target.value)}
            required
          />
        </label>

        <label className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-widest text-sahara-muted">
            Years of Experience <span className="text-sahara-tertiary">*</span>
          </span>
          <input
            id="doctor-yearsOfExperience"
            type="number"
            min={0}
            max={80}
            className="w-full rounded-xl border border-sahara-border/80 bg-white px-4 py-3 text-sahara-fg outline-none transition-all focus:border-sahara-primary focus:ring-2 focus:ring-sahara-primary/20"
            placeholder="10"
            value={yearsOfExperience}
            onChange={(e) => setYearsOfExperience(e.target.value)}
            required
          />
        </label>

        <label className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-widest text-sahara-muted">
            License ID <span className="text-sahara-tertiary">*</span>
          </span>
          <input
            id="doctor-licenseId"
            className="w-full rounded-xl border border-sahara-border/80 bg-white px-4 py-3 text-sahara-fg outline-none transition-all focus:border-sahara-primary focus:ring-2 focus:ring-sahara-primary/20"
            placeholder="MD-123456"
            value={licenseId}
            onChange={(e) => setLicenseId(e.target.value)}
            required
          />
        </label>
      </div>

      <button
        id="doctor-submit-btn"
        type="submit"
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sahara-primary py-4 text-sm font-bold uppercase tracking-widest text-white shadow-md shadow-sahara-primary/10 transition-all hover:opacity-90 disabled:opacity-60"
      >
        {saving ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Saving profile…
          </>
        ) : (
          <>
            Activate Dashboard <ArrowRight className="size-4" />
          </>
        )}
      </button>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  // After successful save, redirect to correct dashboard automatically
  function handleSuccess(role: string) {
    router.replace(role === "doctor" ? "/doctor" : "/patient");
  }

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // Redirect if no role selected yet
  useEffect(() => {
    if (!loading && user && !user.role) {
      router.replace("/onboarding/role-selection");
    }
  }, [loading, user, router]);

  // Redirect if already fully onboarded
  useEffect(() => {
    if (!loading && user?.onboardingComplete && user.role) {
      router.replace(user.role === "doctor" ? "/doctor/dashboard" : "/patient");
    }
  }, [loading, user, router]);

  if (loading || !user || !user.role || user.onboardingComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sahara-bg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-sahara-primary" />
          <p className="text-sm text-sahara-muted">Loading your profile…</p>
        </div>
      </div>
    );
  }

  const isDoctor = user.role === "doctor";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sahara-bg px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-sahara-primary">
            Step 2 of 2
          </p>
          <h1 className="font-serif text-4xl font-light tracking-tight text-sahara-fg md:text-5xl">
            {isDoctor ? "Your Professional Profile" : "Your Health Profile"}
          </h1>
          <p className="mt-4 text-sahara-muted">
            {isDoctor
              ? "Complete your credentials to activate your clinical dashboard."
              : "Complete your profile to personalise your care experience."}
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-sahara-border/40 bg-sahara-card p-8 shadow-ambient md:p-10">
          {/* Security notice */}
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-sahara-border/40 bg-sahara-surface-low p-4">
            <Shield className="mt-0.5 size-4 shrink-0 text-sahara-primary" />
            <p className="text-xs text-sahara-muted">
              Your data is encrypted at rest and in transit. Used only within your care workflow.
            </p>
          </div>

          {isDoctor ? (
            <DoctorForm onSuccess={handleSuccess} />
          ) : (
            <PatientForm onSuccess={handleSuccess} />
          )}
        </div>
      </div>
    </div>
  );
}
