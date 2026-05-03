"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useAuthSession } from "@/hooks/useSessionRole";
import { triggerUiAction } from "@/lib/apiClient";

const STORAGE_KEY = "medbridge:patient-settings";

type PatientSettings = {
  notificationsEmail: boolean;
  notificationsSms: boolean;
  shareDataForResearch: boolean;
};

function load(): PatientSettings {
  if (typeof window === "undefined") {
    return { notificationsEmail: true, notificationsSms: false, shareDataForResearch: false };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { notificationsEmail: true, notificationsSms: false, shareDataForResearch: false };
    return { ...JSON.parse(raw) } as PatientSettings;
  } catch {
    return { notificationsEmail: true, notificationsSms: false, shareDataForResearch: false };
  }
}

export default function PatientSettingsPage() {
  const router = useRouter();
  const sessionQ = useAuthSession();
  const [settings, setSettings] = useState<PatientSettings>(() => load());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(true);

  useEffect(() => {
    if (sessionQ.isError) {
      router.replace("/login?next=/patient/settings");
    }
  }, [sessionQ.isError, router]);

  useEffect(() => {
    if (sessionQ.data?.role === "doctor") {
      router.replace("/doctor/dashboard");
    }
  }, [sessionQ.data?.role, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await triggerUiAction("patient_settings_saved", settings as unknown as Record<string, unknown>);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaving(false);
    const msg = res.ok ? (res.data.message ?? "Preferences saved.") : (res.error ?? "Could not sync preferences.");
    setMessageOk(res.ok);
    setMessage(msg);
    if (res.ok) router.refresh();
  }

  const profile = sessionQ.data?.patientProfile;
  const email = sessionQ.data?.email;

  if (sessionQ.isLoading) {
    return (
      <AppShell title="Settings" subtitle="Patient preferences">
        <p className="text-sm text-sahara-muted">Loading your account…</p>
      </AppShell>
    );
  }

  if (!sessionQ.data || sessionQ.data.role !== "patient") {
    return (
      <AppShell title="Settings" subtitle="Patient preferences">
        <p className="text-sm text-sahara-muted">Redirecting…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Settings" subtitle="Patient preferences">
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <h2 className="font-serif text-2xl">Your account</h2>
            <p className="text-sm text-sahara-muted">Data from sign-up (sync with your backend via GET /api/auth/session).</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-semibold text-sahara-fg">Email:</span>{" "}
              <span className="text-sahara-muted">{email}</span>
            </p>
            {profile ? (
              <ul className="mt-3 grid gap-2 rounded-xl border border-sahara-border/60 bg-sahara-surface-low/50 p-4 text-sahara-muted">
                <li>
                  <span className="font-medium text-sahara-fg">Name:</span> {profile.fullName}
                </li>
                <li>
                  <span className="font-medium text-sahara-fg">Age / sex:</span> {profile.age} · {profile.sex}
                </li>
                <li>
                  <span className="font-medium text-sahara-fg">Height / weight:</span> {profile.heightCm} cm ·{" "}
                  {profile.weightKg} kg
                </li>
                <li>
                  <span className="font-medium text-sahara-fg">Blood type:</span> {profile.bloodType}
                </li>
              </ul>
            ) : (
              <p className="text-sahara-muted">No registration profile on this session yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-serif text-2xl">Notifications & privacy</h2>
            <p className="text-sm text-sahara-muted">Stored on this device; server acknowledges for demo workflows.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <label className="flex items-center justify-between gap-4 rounded-xl border border-sahara-border/60 bg-sahara-surface-low/50 p-4">
                <span className="text-sm font-medium">Email reminders</span>
                <input
                  type="checkbox"
                  checked={settings.notificationsEmail}
                  onChange={(e) => setSettings((s) => ({ ...s, notificationsEmail: e.target.checked }))}
                  className="size-5 accent-sahara-primary"
                />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-xl border border-sahara-border/60 bg-sahara-surface-low/50 p-4">
                <span className="text-sm font-medium">SMS alerts (if on file)</span>
                <input
                  type="checkbox"
                  checked={settings.notificationsSms}
                  onChange={(e) => setSettings((s) => ({ ...s, notificationsSms: e.target.checked }))}
                  className="size-5 accent-sahara-primary"
                />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-xl border border-sahara-border/60 bg-sahara-surface-low/50 p-4">
                <span className="text-sm font-medium">Share anonymized data for research</span>
                <input
                  type="checkbox"
                  checked={settings.shareDataForResearch}
                  onChange={(e) => setSettings((s) => ({ ...s, shareDataForResearch: e.target.checked }))}
                  className="size-5 accent-sahara-primary"
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-sahara-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save preferences"}
              </button>
              {message ? (
                <p className={`text-sm ${messageOk ? "text-emerald-800" : "text-red-800"}`}>{message}</p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
