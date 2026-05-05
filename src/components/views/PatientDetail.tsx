"use client";

import { format } from "date-fns";
import { useState } from "react";
import { safeFetch } from "@/lib/safeFetch";

import { Badge } from "@/components/ui/Badge";
import { useDoctors } from "@/hooks/useDoctors";
import { usePatient } from "@/hooks/usePatient";
import { saveDoctorNotes, triggerUiAction } from "@/lib/apiClient";

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
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "doctor"; content: string }>>([
    {
      role: "assistant",
      content: "Hello, I am the MedBridge Online Doctor Assistant. How can I help with this patient's clinical care today?",
    },
  ]);

  const handleSave = async (status: "draft" | "signed") => {
    if (!patientQ.data?.patient.id) return;
    setSaveState("saving");
    setActionFeedback(null);

    const res = await saveDoctorNotes({
      patientId: patientQ.data.patient.id,
      doctorId: doctor?.id ?? null,
      subjective,
      bp: bp.trim() ? bp.trim() : null,
      heartRate: heartRate.trim() ? heartRate.trim() : null,
      assessment,
      status,
    });

    setSaveState(res.ok ? "saved" : "error");
  };

  const handleSendChat = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    setMessages((current) => [...current, { role: "doctor", content: trimmed }]);
    setChatInput("");
    setChatLoading(true);

    const result = await safeFetch<any>("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ symptom: trimmed, followUpAnswer: "Doctor requested support from patient detail." }),
    });

    const raw = result.success ? result.data : null;
    const inner = raw?.result ?? raw?.payload ?? raw;
    const d =
      inner && typeof inner === "object" && !Array.isArray(inner) ? (inner as Record<string, unknown>) : raw;

    const text = d
      ? [d.summary, d.recommendation, d.question, d.message, d.guidance]
          .filter((x) => typeof x === "string" && String(x).trim())
          .join("\n\n")
      : "";

    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        content: text || (result.success ? "No summary returned. Try rephrasing your question." : "I could not reach the assistant endpoint. Please try again."),
      },
    ]);

    setChatLoading(false);
  };

  const handleOrderLab = async () => {
    setActionLoading(true);
    setActionFeedback(null);
    const res = await triggerUiAction("doctor_order_lab", {
      patientId: patientQ.data?.patient.id ?? null,
      doctorId: doctor?.id ?? null,
    });
    setActionLoading(false);
    setActionFeedback(res.ok ? (res.data.message ?? "Lab order created and queued for review.") : "Could not create lab order.");
  };

  const handleAddPrescription = async () => {
    setActionLoading(true);
    setActionFeedback(null);
    const res = await triggerUiAction("doctor_add_prescription", {
      patientId: patientQ.data?.patient.id ?? null,
      doctorId: doctor?.id ?? null,
    });
    setActionLoading(false);
    setActionFeedback(res.ok ? (res.data.message ?? "Prescription draft created.") : "Could not create prescription draft.");
  };

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
                onClick={() => handleSave("draft")}
                className="rounded-lg border border-sahara-border px-6 py-3 text-xs font-bold uppercase tracking-widest text-sahara-muted"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSave("signed")}
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

        <div className="rounded-xl border border-sahara-border/30 bg-white p-6 shadow-ambient">
          <h3 className="mb-3 font-serif text-xl">Care assistant</h3>
          <div className="mb-3 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-sahara-border/50 bg-sahara-surface-low/50 p-3">
            {messages.map((m, i) => (
              <div key={`${m.role}-${i}`} className="rounded-lg bg-white p-2 text-xs shadow-sm">
                <span className="font-bold uppercase text-sahara-muted">{m.role === "doctor" ? "You" : "AI"}</span>
                <p className="mt-1 whitespace-pre-wrap text-sahara-fg">{m.content}</p>
              </div>
            ))}
            {chatLoading ? <p className="text-center text-xs text-sahara-muted">Thinking…</p> : null}
          </div>
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            rows={3}
            placeholder="Ask for medication review, labs, or follow-up…"
            className="mb-2 w-full rounded-lg border border-sahara-border/60 bg-sahara-surface-low p-2 text-sm"
          />
          <button
            type="button"
            disabled={chatLoading || !chatInput.trim()}
            onClick={handleSendChat}
            className="w-full rounded-lg bg-sahara-primary py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Send to assistant
          </button>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleOrderLab}
              className="rounded-lg border border-sahara-border py-2 text-xs font-bold uppercase tracking-wide text-sahara-fg disabled:opacity-50"
            >
              Order labs
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleAddPrescription}
              className="rounded-lg border border-sahara-border py-2 text-xs font-bold uppercase tracking-wide text-sahara-fg disabled:opacity-50"
            >
              New Rx
            </button>
          </div>
          {actionFeedback ? <p className="mt-3 text-xs text-sahara-muted">{actionFeedback}</p> : null}
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

