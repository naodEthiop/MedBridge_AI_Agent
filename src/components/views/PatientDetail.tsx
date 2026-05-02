"use client";

import { format } from "date-fns";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { useDoctors } from "@/hooks/useDoctors";
import { usePatient } from "@/hooks/usePatient";
import { saveDoctorNotes } from "@/lib/apiClient";

export function PatientDetail(props: { id: string }) {
  const patientQ = usePatient(props.id);
  const doctorsQ = useDoctors();

  const loading = patientQ.isLoading || doctorsQ.isLoading;
  const error = patientQ.error || doctorsQ.error;

  const doctor = doctorsQ.data?.find((d) => d.id === patientQ.data?.patient.primaryDoctorId);

  const [subjective, setSubjective] = useState("");
  const [bp, setBp] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [assessment, setAssessment] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <section className="space-y-8 lg:col-span-7">
        <div className="rounded-xl border border-sahara-border/30 bg-white p-8 shadow-ambient">
          {loading ? (
            <p className="text-sm text-sahara-muted">Loading…</p>
          ) : error ? (
            <p className="text-sm text-sahara-tertiary">Failed to load patient.</p>
          ) : (
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-3xl tracking-tight">{patientQ.data?.patient.fullName}</h2>
                <p className="mt-2 text-sm text-sahara-muted">
                  Patient ID: {patientQ.data?.patient.id} · DOB:{" "}
                  {patientQ.data?.patient.dateOfBirth
                    ? format(new Date(patientQ.data.patient.dateOfBirth), "PP")
                    : "—"}
                </p>
                <p className="mt-1 text-sm text-sahara-muted">
                  Primary doctor: {doctor?.fullName ?? "—"} {doctor?.specialty ? `(${doctor.specialty})` : ""}
                </p>
              </div>
              <Badge tone="primary">Active</Badge>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-sahara-border/30 bg-white p-8 shadow-ambient">
          <h3 className="mb-6 font-serif text-2xl">Clinical Examination Notes</h3>
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-sahara-muted">
                Subjective Symptoms
              </label>
              <textarea
                className="w-full rounded-lg border border-sahara-border/60 bg-sahara-surface-low p-3 text-sm"
                rows={3}
                placeholder="Patient-reported symptoms..."
                value={subjective}
                onChange={(e) => setSubjective(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-sahara-muted">BP (mmHg)</label>
                <input
                  className="w-full rounded-lg border border-sahara-border/60 bg-sahara-surface-low p-3 text-sm"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  placeholder="e.g. 120/80"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-sahara-muted">
                  Heart Rate (bpm)
                </label>
                <input
                  className="w-full rounded-lg border border-sahara-border/60 bg-sahara-surface-low p-3 text-sm"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  placeholder="e.g. 72"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-sahara-muted">
                Assessment & Plan
              </label>
              <textarea
                className="w-full rounded-lg border border-sahara-border/60 bg-sahara-surface-low p-3 text-sm"
                rows={4}
                placeholder="Diagnostic notes and treatment plan..."
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={async () => {
                  if (!patientQ.data?.patient.id) return;
                  setSaveState("saving");
                  const res = await saveDoctorNotes({
                    patientId: patientQ.data.patient.id,
                    doctorId: doctor?.id ?? null,
                    subjective,
                    bp: bp.trim() ? bp.trim() : null,
                    heartRate: heartRate.trim() ? heartRate.trim() : null,
                    assessment,
                    status: "draft",
                  });
                  setSaveState(res.ok ? "saved" : "error");
                }}
                className="rounded-lg border border-sahara-border px-6 py-3 text-xs font-bold uppercase tracking-widest text-sahara-muted"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!patientQ.data?.patient.id) return;
                  setSaveState("saving");
                  const res = await saveDoctorNotes({
                    patientId: patientQ.data.patient.id,
                    doctorId: doctor?.id ?? null,
                    subjective,
                    bp: bp.trim() ? bp.trim() : null,
                    heartRate: heartRate.trim() ? heartRate.trim() : null,
                    assessment,
                    status: "signed",
                  });
                  setSaveState(res.ok ? "saved" : "error");
                }}
                className="rounded-lg bg-sahara-primary px-6 py-3 text-xs font-bold uppercase tracking-widest text-white"
              >
                Authorize & Sign
              </button>
            </div>
            {saveState === "saving" ? <p className="text-xs text-sahara-muted">Saving…</p> : null}
            {saveState === "saved" ? <p className="text-xs text-emerald-700">Saved.</p> : null}
            {saveState === "error" ? <p className="text-xs text-sahara-tertiary">Failed to save.</p> : null}
          </div>
        </div>
      </section>

      <aside className="space-y-8 lg:col-span-5">
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-8 text-stone-100 shadow-xl">
          <h3 className="mb-6 font-serif text-2xl italic text-[#f0a878]">Diagnostic Support AI</h3>
          <div className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#f0a878]">Primary Suggestion</p>
              <p className="mt-2 font-serif text-xl">—</p>
              <p className="mt-2 text-sm text-stone-400">
                Submit scans or notes to generate patient-specific insights.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-sahara-border/30 bg-white p-8 shadow-ambient">
          <h3 className="mb-4 font-serif text-xl">Appointments</h3>
          {loading ? (
            <p className="text-sm text-sahara-muted">Loading…</p>
          ) : error ? (
            <p className="text-sm text-sahara-tertiary">Failed to load appointments.</p>
          ) : patientQ.data?.appointments.length ? (
            <div className="grid gap-3">
              {patientQ.data.appointments.slice(0, 6).map((a) => (
                <div key={a.id} className="rounded-2xl bg-sahara-surface-low p-4 ring-1 ring-sahara-border/60">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{a.reason ?? "Appointment"}</p>
                      <p className="mt-1 text-xs text-sahara-muted">{format(new Date(a.startTime), "PPpp")}</p>
                    </div>
                    <Badge tone={a.status === "cancelled" ? "danger" : "neutral"}>{a.status}</Badge>
                  </div>
                  {a.location ? <p className="mt-2 text-xs text-sahara-muted">{a.location}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-sahara-muted">No appointments.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-sahara-border/30 bg-sahara-primary/10 p-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-sahara-primary">Adherence</h4>
            <p className="mt-2 font-serif text-3xl">—</p>
          </div>
          <div className="rounded-xl border border-sahara-border/30 bg-sahara-tertiary/10 p-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-sahara-tertiary">Risk Score</h4>
            <p className="mt-2 font-serif text-3xl text-sahara-tertiary">—</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

