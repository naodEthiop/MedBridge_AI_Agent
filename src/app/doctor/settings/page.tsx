"use client";

import { FormEvent, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { triggerUiAction } from "@/lib/apiClient";

type DoctorSettings = { name: string; email: string; phone: string; clinic: string };

function loadSettings(): DoctorSettings {
  if (typeof window === "undefined") {
    return { name: "Dr. Aris", email: "dr.aris@medbridge.com", phone: "(555) 123-4567", clinic: "MedBridge Clinic" };
  }
  const saved = JSON.parse(window.localStorage.getItem("medbridge:doctor-settings") ?? "null") as Partial<DoctorSettings> | null;
  return {
    name: saved?.name ?? "Dr. Aris",
    email: saved?.email ?? "dr.aris@medbridge.com",
    phone: saved?.phone ?? "(555) 123-4567",
    clinic: saved?.clinic ?? "MedBridge Clinic",
  };
}

export default function DoctorSettingsPage() {
  const initial = loadSettings();
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [clinic, setClinic] = useState(initial.clinic);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    const res = await triggerUiAction("doctor_settings_saved", { name, email, phone, clinic });
    window.localStorage.setItem("medbridge:doctor-settings", JSON.stringify({ name, email, phone, clinic }));
    setSaving(false);
    setFeedback(res.ok ? (res.data.message ?? "Settings saved successfully.") : "Could not save settings.");
  }

  return (
    <AppShell title="Doctor: Settings" subtitle="Manage your account and preferences">
      <Card className="max-w-3xl">
        <CardHeader>
          <h3 className="font-serif text-2xl">Profile and preferences</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="block text-xs font-bold uppercase tracking-widest text-sahara-muted">Name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-lg border border-sahara-border/60 bg-sahara-surface-low p-3 text-sm" />
              </label>
              <label className="space-y-2 text-sm">
                <span className="block text-xs font-bold uppercase tracking-widest text-sahara-muted">Email</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-sahara-border/60 bg-sahara-surface-low p-3 text-sm" type="email" />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="block text-xs font-bold uppercase tracking-widest text-sahara-muted">Phone</span>
                <input value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-lg border border-sahara-border/60 bg-sahara-surface-low p-3 text-sm" />
              </label>
              <label className="space-y-2 text-sm">
                <span className="block text-xs font-bold uppercase tracking-widest text-sahara-muted">Clinic</span>
                <input value={clinic} onChange={(event) => setClinic(event.target.value)} className="w-full rounded-lg border border-sahara-border/60 bg-sahara-surface-low p-3 text-sm" />
              </label>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving} className="rounded-lg bg-sahara-primary px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-50">
                {saving ? "Saving..." : "Save Settings"}
              </button>
              {feedback ? <span className="text-sm text-emerald-700">{feedback}</span> : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
