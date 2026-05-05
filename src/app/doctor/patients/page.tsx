"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { PatientsPanel } from "@/components/views/PatientsPanel";
import { triggerUiAction } from "@/lib/apiClient";

export default function DoctorPatientsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");

  const handleAddPatient = async () => {
    setLoading(true);
    setFeedback(null);
    const res = await triggerUiAction("doctor_add_patient", { fullName: newPatientName.trim() || null });
    setLoading(false);
    setShowAddPatient(false);
    setFeedback(
      res.ok
        ? `${newPatientName || "New patient"} queued. ${res.data.message ?? ""}`.trim()
        : "Could not queue new patient registration.",
    );
    setNewPatientName("");
  };

  const handleRefresh = async () => {
    const res = await triggerUiAction("doctor_patients_refreshed");
    setFeedback(res.ok ? (res.data.message ?? "Refreshing patient data...") : "Failed to refresh patient data.");
    router.refresh();
  };

  return (
    <AppShell title="Doctor: Patient List" subtitle="">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-3xl">Patient List</h2>
            <p className="mt-2 text-sm text-sahara-muted">Browse your patient roster and open records quickly.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-xl border border-sahara-border/60 bg-white px-4 py-2 text-sm font-semibold text-sahara-fg transition hover:bg-sahara-surface"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setShowAddPatient(true)}
              disabled={loading}
              className="rounded-xl bg-sahara-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-sahara-primary-2 disabled:opacity-50"
            >
              {loading ? "Working…" : "Add Patient"}
            </button>
          </div>
        </div>
        <PatientsPanel />
        {feedback ? <p className="text-sm text-sahara-muted">{feedback}</p> : null}
      </div>
      {showAddPatient ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <h3 className="font-serif text-3xl">Register New Patient</h3>
            <label className="mt-6 block space-y-2 text-sm">
              <span className="text-xs font-bold uppercase tracking-widest text-sahara-muted">Full Name</span>
              <input
                value={newPatientName}
                onChange={(event) => setNewPatientName(event.target.value)}
                className="w-full rounded-xl border border-sahara-border bg-sahara-surface-low p-3"
                placeholder="e.g. Evelyn Knight"
              />
            </label>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddPatient(false)}
                className="flex-1 rounded-xl border border-sahara-border px-4 py-3 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddPatient}
                disabled={loading}
                className="flex-1 rounded-xl bg-sahara-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {loading ? "Registering..." : "Add Patient"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
