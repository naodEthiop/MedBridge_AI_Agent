"use client";

import { Download, RefreshCw, Share2, ShieldAlert } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { differenceInYears, format } from "date-fns";

import { AppShell } from "@/components/layout/AppShell";
import { DigitalHealthCardWallet } from "@/components/views/DigitalHealthCardWallet";
import { useAuthSession } from "@/hooks/useSessionRole";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { usePatient } from "@/hooks/usePatient";
import { triggerUiAction } from "@/lib/apiClient";
import { buildHealthCardHtml, computeTrustScore } from "@/lib/health-card-download";

export default function HealthCardPage() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

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

  const issuedLabel = format(new Date(), "M/d/yyyy");
  const walletStatus = apiPatient && patientQuery.isSuccess ? "verified" : "pending";
  const trustScore = computeTrustScore({
    conditions,
    allergies,
    hasDateOfBirth: Boolean(apiPatient?.dateOfBirth ?? profile?.age),
  });
  const conditionsSummary = useMemo(() => {
    const real = conditions.filter((c) => c.toLowerCase() !== "no conditions on file");
    const parts = [...real.slice(0, 2), ...(allergies.length ? [`Allergies: ${allergies.slice(0, 2).join(", ")}`] : [])];
    const line = parts.length ? parts.join(" · ") : "Clinical summary syncing";
    return line.length > 120 ? `${line.slice(0, 117)}…` : line;
  }, [conditions, allergies]);

  useEffect(() => {
    async function generateQR() {
      setQrLoading(true);
      try {
        const res = await fetch("/api/health-card/qr", {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        const data = (await res.json()) as { ok: boolean; qrImageUrl?: string };
        if (data.ok && data.qrImageUrl) {
          setQrImageUrl(data.qrImageUrl);
        }
      } catch (error) {
        console.error("Failed to generate QR code:", error);
      } finally {
        setQrLoading(false);
      }
    }
    generateQR();
  }, [patientId]);

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
    const html = buildHealthCardHtml({
      displayName,
      email: sessionQ.data?.email ?? "—",
      patientId: String(displayId),
      trustScore,
      status: walletStatus,
      issuedLabel,
      bloodType: String(bloodType),
      ageLabel: ageYears != null ? `${ageYears} yrs` : "Age —",
      conditionsLine: conditionsSummary,
    });
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeFileId = String(displayId).replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 48) || "card";
    a.download = `medbridge-health-card-${safeFileId}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setActionLoading(false);
    setFeedback(
      res.ok
        ? `${res.data.message ?? "Export ready."} Open the HTML file in any browser to view your card.`
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
    setQrLoading(true);
    try {
      const res = await fetch("/api/health-card/qr", {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const data = (await res.json()) as { ok: boolean; qrImageUrl?: string };
      if (data.ok && data.qrImageUrl) {
        setQrImageUrl(data.qrImageUrl);
        setFeedback("QR code refreshed successfully.");
      }
    } catch (error) {
      setFeedback("Failed to refresh QR code. Please try again.");
    } finally {
      setQrLoading(false);
    }
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
    <AppShell title="Digital Health Card" subtitle="Portable health summary with secure QR code">
      <section className="mx-auto w-full max-w-6xl space-y-4 py-2">
        <div className="mb-6 text-center lg:text-left">
          <h2 className="mb-3 font-serif text-4xl font-bold leading-tight lg:text-5xl">Your Digital Health Card</h2>
          <p className="max-w-xl text-sahara-muted">
            A portable summary of your health information that stays up-to-date and can be shared securely with healthcare providers.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            <div className="flex justify-center lg:justify-start">
              <DigitalHealthCardWallet
                displayName={displayName}
                email={sessionQ.data?.email ?? "—"}
                patientId={String(displayId)}
                trustScore={trustScore}
                status={walletStatus}
                issuedLabel={issuedLabel}
                bloodType={String(bloodType)}
                ageLabel={ageYears != null ? `${ageYears} yrs` : "Age —"}
                conditionsSummary={conditionsSummary}
              />
            </div>

            <div className="rounded-[1.8rem] border border-sahara-border/80 bg-sahara-surface-low/80 p-6 shadow-inner md:p-8">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-sahara-fg md:text-2xl">Clinical details</h3>
                  <p className="mt-1 text-xs text-sahara-muted">Full record fields for care teams and check-in.</p>
                </div>
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-sahara-border bg-white font-serif text-2xl font-bold text-sahara-muted">
                  {displayName !== "—"
                    ? displayName
                        .split(/\s+/)
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "?"}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-stone-400">Patient ID</p>
                  <p className="font-mono text-sm font-semibold">{displayId}</p>
                </div>
                <div>
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-stone-400">Sex</p>
                  <p className="text-sm font-semibold">{sexDisplay}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-stone-400">Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {conditions.length ? (
                      conditions.map((condition) => (
                        <span
                          key={condition}
                          className="rounded-full border border-sahara-border bg-white px-2 py-0.5 text-xs font-medium text-sahara-muted"
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
                  <div className="sm:col-span-2">
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
                <div className="flex gap-10 sm:col-span-2">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Height</p>
                    <p className="text-sm font-semibold">{heightCm != null ? `${heightCm} cm` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Weight</p>
                    <p className="text-sm font-semibold">{weightKg != null ? `${weightKg} kg` : "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
              <button
                type="button"
                onClick={() => void handleDownloadPdf()}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-lg bg-sahara-primary px-6 py-3 font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-95"
              >
                <Download className="size-5" />
                Download card (HTML)
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
                <img alt="Health card QR code" className="h-40 w-40 object-contain" src={qrImageUrl || undefined} width={160} height={160} />
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
