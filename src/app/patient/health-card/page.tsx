"use client";

import { Download, RefreshCw, Share2, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { differenceInYears } from "date-fns";

import { AppShell } from "@/components/layout/AppShell";
import { useAuthSession } from "@/hooks/useSessionRole";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { usePatient } from "@/hooks/usePatient";
import { triggerUiAction } from "@/lib/apiClient";

export default function HealthCardPage() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [qrNonce, setQrNonce] = useState(0);

  const sessionQ = useAuthSession();
  const summary = useDashboardSummary();

  const email = sessionQ.data?.email?.toLowerCase() ?? "";
  const profile = sessionQ.data?.patientProfile;

  const linkedPatient = useMemo(() => {
    const list = summary.patients;
    if (!list.length) return null;
    const byEmail = email ? list.find((p) => p.email?.toLowerCase() === email) : undefined;
    return byEmail ?? list[0] ?? null;
  }, [summary.patients, email]);

  const patientId = linkedPatient?.id ?? "";
  const patientQuery = usePatient(patientId);
  const apiPatient = patientQuery.data?.patient;

  const displayName = profile?.fullName ?? apiPatient?.fullName ?? "—";
  const displayId = (apiPatient?.id ?? patientId) || "—";
  const sexLabel = (profile?.sex ?? apiPatient?.sex ?? "—") as string;
  const sexDisplay = typeof sexLabel === "string" ? sexLabel[0].toUpperCase() + sexLabel.slice(1) : "—";

  const ageYears = profile?.age ?? (apiPatient?.dateOfBirth ? differenceInYears(new Date(), new Date(apiPatient.dateOfBirth)) : null);
  const heightCm = profile?.heightCm ?? null;
  const weightKg = profile?.weightKg ?? null;
  const bloodType = profile?.bloodType ?? "—";

  const conditions = apiPatient?.conditions?.length ? apiPatient.conditions : ["No conditions on file"];
  const allergies = apiPatient?.allergies?.length ? apiPatient.allergies : [];

  const qrPayload = useMemo(
    () =>
      JSON.stringify({
        v: 1,
        app: "medbridge",
        patientId: displayId,
        email: sessionQ.data?.email ?? null,
        nonce: qrNonce,
        issued: new Date().toISOString(),
        note: "Replace with signed token from your backend",
      }),
    [displayId, qrNonce, sessionQ.data?.email],
  );

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrPayload)}`;

  async function runAction(action: string) {
    setActionLoading(true);
    setFeedback(null);
    const res = await triggerUiAction(action, { patientId: patientId || displayId });
    setActionLoading(false);
    setFeedback(res.ok ? (res.data.message ?? "Action completed.") : "Action failed. Please try again.");
  }

  async function handleDownloadPdf() {
    setActionLoading(true);
    setFeedback(null);
    const res = await triggerUiAction("health_card_download_pdf", { patientId: patientId || displayId });
    const blob = new Blob(
      [
        `MedBridge Health Card\nName: ${displayName}\nID: ${displayId}\nEmail: ${sessionQ.data?.email ?? ""}\n` +
          `Age: ${ageYears ?? "—"}\nSex: ${sexDisplay}\nBlood: ${bloodType}\nHeight: ${heightCm ?? "—"} cm\nWeight: ${weightKg ?? "—"} kg\n` +
          `Conditions: ${conditions.join(", ")}\nAllergies: ${allergies.join(", ") || "—"}\n`,
      ],
      { type: "text/plain;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medbridge-health-card-${displayId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setActionLoading(false);
    setFeedback(
      res.ok
        ? `${res.data.message ?? "Export queued."} A summary file was downloaded to this device.`
        : "Action failed. Please try again.",
    );
  }

  async function handleShare() {
    setActionLoading(true);
    setFeedback(null);
    const res = await triggerUiAction("health_card_share_access", { patientId: patientId || displayId });
    const apiNote = res.ok ? (res.data.message ?? "Secure link prepared.") : "Action failed. Please try again.";
    const text = `MedBridge health summary for ${displayName} (${displayId}).`;
    if (!res.ok) {
      setActionLoading(false);
      setFeedback(apiNote);
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({ title: "MedBridge Health Card", text });
        setFeedback(`${apiNote} Shared from this device.`);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setFeedback(`${apiNote} Summary copied to clipboard.`);
      } else {
        setFeedback(`${apiNote} ${text}`);
      }
    } catch {
      setFeedback(`${apiNote} Share was cancelled or unavailable.`);
    }
    setActionLoading(false);
  }

  async function handleRefreshQr() {
    setQrNonce((n) => n + 1);
    await runAction("health_card_refresh_qr");
  }

  if (sessionQ.isLoading || summary.loading) {
    return (
      <AppShell title="Digital Health Card" subtitle="Portable summary & check-in QR">
        <p className="text-sm text-sahara-muted">Loading your health card…</p>
      </AppShell>
    );
  }

  if (sessionQ.isError || sessionQ.data?.role !== "patient") {
    return (
      <AppShell title="Digital Health Card" subtitle="Portable summary & check-in QR">
        <p className="text-sm text-sahara-muted">This page is for signed-in patients.</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Digital Health Card" subtitle="Live data from your account + care record">
      <section className="mx-auto w-full max-w-6xl space-y-4 py-2">
        <p className="max-w-2xl text-xs text-sahara-muted">
          Vitals and demographics come from <strong>sign-up (session)</strong>; conditions and allergies from{" "}
          <strong>GET /api/patients/:id</strong>. Point both at your backend when you integrate.
        </p>

        <div className="mb-6 text-center lg:text-left">
          <h2 className="mb-3 font-serif text-4xl font-bold leading-tight lg:text-5xl">Your Digital Health Card</h2>
          <p className="max-w-xl text-sahara-muted">
            Updates when your session and patient record change. QR encodes a demo payload—swap for a signed token from your API.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="relative mx-auto aspect-[1.58/1] w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white p-1 shadow-2xl lg:mx-0">
              <div className="absolute inset-0 bg-gradient-to-br from-[#f6f0e8] via-white to-[#fbe8d8] opacity-40" />
              <div className="absolute -right-24 -top-24 size-64 rounded-full bg-sahara-primary/5 blur-3xl" />

              <div className="relative flex h-full w-full flex-col rounded-[1.8rem] border border-sahara-border p-8">
                <div className="mb-8 flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-2xl font-bold tracking-tight text-sahara-primary">MedBridge</h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sahara-primary">
                      Universal Health Identity
                    </p>
                  </div>
                  <div className="rounded-full bg-sahara-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-sahara-primary">
                    Active
                  </div>
                </div>

                <div className="flex flex-1 gap-8">
                  <div className="flex size-[7.5rem] shrink-0 items-center justify-center rounded-xl border border-sahara-border bg-[#ece6dc] font-serif text-3xl font-bold text-sahara-muted">
                    {displayName !== "—"
                      ? displayName
                          .split(/\s+/)
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "?"}
                  </div>

                  <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-6">
                    <div>
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-stone-400">Full Name</p>
                      <p className="font-serif text-lg font-bold">{displayName}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-stone-400">Patient ID</p>
                      <p className="font-serif text-lg font-bold">{displayId}</p>
                    </div>
                    <div className="col-span-2 grid grid-cols-3 gap-4">
                      <div>
                        <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-stone-400">Age</p>
                        <p className="text-base font-bold">{ageYears ?? "—"}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-stone-400">Sex</p>
                        <p className="text-base font-bold">{sexDisplay}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-stone-400">Blood Type</p>
                        <p className="text-base font-bold text-sahara-tertiary">{bloodType}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-stone-400">Conditions</p>
                      <div className="flex flex-wrap gap-2">
                        {conditions.length ? (
                          conditions.map((condition) => (
                            <span
                              key={condition}
                              className="rounded-full border border-sahara-border bg-[#ece6dc] px-2 py-0.5 text-xs font-medium text-sahara-muted"
                            >
                              {condition}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-sahara-muted">None recorded</span>
                        )}
                      </div>
                    </div>
                    {allergies.length ? (
                      <div className="col-span-2">
                        <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-stone-400">Allergies</p>
                        <div className="flex flex-wrap gap-2">
                          {allergies.map((a) => (
                            <span
                              key={a}
                              className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-auto flex items-end justify-between pt-6">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Height</p>
                      <p className="text-sm font-semibold">{heightCm != null ? `${heightCm} cm` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Weight</p>
                      <p className="text-sm font-semibold">{weightKg != null ? `${weightKg} kg` : "—"}</p>
                    </div>
                  </div>
                  <div className="max-w-[140px] text-right text-[8px] font-medium leading-tight text-stone-400">
                    Record sync: demo API. Replace with your backend services.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
              <button
                type="button"
                onClick={() => void handleDownloadPdf()}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-lg bg-sahara-primary px-6 py-3 font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-95"
              >
                <Download className="size-5" />
                Download summary
              </button>
              <button
                type="button"
                onClick={() => void handleShare()}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-lg border border-sahara-border bg-white px-6 py-3 font-bold text-sahara-fg transition-all hover:bg-sahara-surface-low active:scale-95"
              >
                <Share2 className="size-5" />
                Share access
              </button>
            </div>
            {feedback ? <p className="mt-4 text-sm text-sahara-muted">{feedback}</p> : null}
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <div className="flex flex-col items-center rounded-3xl border border-sahara-border bg-sahara-surface-low p-8 text-center shadow-sm">
              <h4 className="mb-2 font-serif text-xl font-bold">Check-in QR</h4>
              <p className="mb-6 max-w-xs text-xs text-sahara-muted">
                Demo payload includes patient id and email. Production: short-lived signed token from your server.
              </p>
              <div className="relative mb-4 rounded-2xl border border-sahara-border bg-white p-4 shadow-inner">
                <img alt="Health card QR code" className="h-40 w-40 object-contain" src={qrImageUrl} width={160} height={160} />
              </div>
              <p className="px-4 text-sm font-medium text-sahara-muted">Refresh rotates the demo nonce.</p>
              <button
                type="button"
                onClick={() => void handleRefreshQr()}
                disabled={actionLoading}
                className="mt-6 flex items-center gap-2 text-sm font-bold text-sahara-primary hover:underline"
              >
                <RefreshCw className="size-4" />
                Refresh code
              </button>
            </div>

            <div className="flex items-start gap-4 rounded-3xl border border-red-300/30 bg-red-100/30 p-6">
              <div className="shrink-0 rounded-xl bg-red-200 p-2 text-red-700">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <h5 className="text-sm font-bold text-red-900">Emergency</h5>
                <p className="mt-1 text-xs text-red-900/70">
                  In production, surface emergency contacts and critical flags from your backend only.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}
