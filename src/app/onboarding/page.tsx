"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Role = "patient" | "doctor";

export default function OnboardingPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/user/me", { cache: "no-store", credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.user) {
        router.replace("/auth/login");
        return;
      }
      if (!data.user.role) {
        router.replace("/onboarding/role-selection");
        return;
      }
      if (data.user.onboardingComplete) {
        router.replace(data.user.role === "doctor" ? "/doctor" : "/patient");
        return;
      }
      setRole(data.user.role);
      setForm((prev) => ({ ...prev, fullName: data.user.fullName ?? "" }));
    })();
  }, [router]);

  async function submit() {
    if (!role) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/onboarding/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, role }) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok || !data.success) {
      setError(data.error ?? "Failed to save onboarding.");
      return;
    }
    router.replace(data.role === "doctor" ? "/doctor" : "/patient");
  }

  if (!role) return <main className="mx-auto max-w-xl py-16">Loading...</main>;

  return (
    <main className="mx-auto max-w-xl py-12 space-y-3">
      <h1 className="text-2xl">{role === "doctor" ? "Doctor onboarding" : "Patient onboarding"}</h1>
      <input className="border p-2 w-full" placeholder="fullName" value={form.fullName ?? ""} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
      {role === "patient" ? (
        <>
          <input className="border p-2 w-full" placeholder="age" onChange={(e) => setForm({ ...form, age: e.target.value })} />
          <input className="border p-2 w-full" placeholder="gender" onChange={(e) => setForm({ ...form, gender: e.target.value })} />
          <input className="border p-2 w-full" placeholder="phone" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <textarea className="border p-2 w-full" placeholder="optional medical notes" onChange={(e) => setForm({ ...form, medicalNotes: e.target.value })} />
        </>
      ) : (
        <>
          <input className="border p-2 w-full" placeholder="specialization" onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
          <input className="border p-2 w-full" placeholder="hospital" onChange={(e) => setForm({ ...form, hospital: e.target.value })} />
          <input className="border p-2 w-full" placeholder="yearsOfExperience" onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })} />
          <input className="border p-2 w-full" placeholder="licenseId" onChange={(e) => setForm({ ...form, licenseId: e.target.value })} />
        </>
      )}
      <button className="bg-black text-white p-3 rounded" onClick={submit} disabled={saving}>{saving ? "Saving..." : "Save and continue"}</button>
      {error ? <p className="text-red-600">{error}</p> : null}
    </main>
  );
}
