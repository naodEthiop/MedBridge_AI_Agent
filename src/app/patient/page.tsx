"use client";

import Link from "next/link";
import { differenceInYears, format } from "date-fns";
import { AlertTriangle, Camera, HeartPulse, Pill, Sparkles } from "lucide-react";
import { useRef, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PatientsPanel } from "@/components/views/PatientsPanel";
import { UpcomingAppointments } from "@/components/views/UpcomingAppointments";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";

export default function PatientDashboardPage() {
  const summary = useDashboardSummary();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [visualFeedback, setVisualFeedback] = useState<string | null>(null);
  const currentPatient = summary.currentPatient;
  const currentDoctor = summary.currentDoctor;
  const nextAppointment = summary.nextAppointment;
  const firstName = currentPatient?.fullName.split(" ")[0] ?? "there";

  return (
    <AppShell title="Patient Dashboard" subtitle="Stitch screen: Patient Dashboard">
      <div className="space-y-8">
        <div>
          <h2 className="font-serif text-4xl italic leading-tight">Hi {firstName}, how are you feeling today?</h2>
          <p className="mt-2 text-lg text-sahara-muted">
            Your health summary is updated from the current MCP-backed patient record.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <Card className="col-span-12 border border-sahara-border/40 bg-sahara-surface-low md:col-span-8">
            <CardContent className="relative p-8">
              <div className="mb-6 inline-flex size-14 items-center justify-center rounded-2xl bg-sahara-primary-2/30 text-sahara-primary">
                <Sparkles className="size-7" />
              </div>
              <h3 className="font-serif text-3xl">AI Symptom Checker</h3>
              <p className="mt-3 max-w-md leading-relaxed text-sahara-muted">
                Describe symptoms or upload a voice note for immediate clinical-grade assessment.
              </p>
              <Link
                href="/patient/symptom-checker"
                className="mt-8 inline-flex items-center rounded-xl bg-sahara-primary px-8 py-3 font-bold text-white hover:bg-sahara-primary-2"
              >
                Start Assessment
              </Link>
            </CardContent>
          </Card>

          <Card className="col-span-12 border border-sahara-border/50 md:col-span-4">
            <CardContent className="p-8">
              <Pill className="size-9 text-sahara-primary" />
              <h3 className="mt-5 font-serif text-2xl">Medication Scanner</h3>
              <p className="mt-2 text-sm text-sahara-muted">
                Scan prescriptions to check interactions and set reminders.
              </p>
              <Link
                href="/patient/scanners"
                className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-sahara-surface-low px-5 py-3 font-semibold ring-1 ring-sahara-border/60 hover:bg-sahara-surface"
              >
                Launch Scanner
              </Link>
            </CardContent>
          </Card>

          <div className="col-span-12">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h3 className="font-serif text-2xl">Synced Summary</h3>
              <Badge tone={summary.loading ? "neutral" : "primary"}>{summary.loading ? "Loading" : "Live"}</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-sahara-border/60 bg-white p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-sahara-muted">Current Patient</p>
                <p className="mt-2 font-serif text-3xl">{currentPatient?.fullName ?? "Loading"}</p>
                <p className="mt-2 text-sm text-sahara-muted">
                  {currentPatient?.dateOfBirth
                    ? `${differenceInYears(new Date(), new Date(currentPatient.dateOfBirth))} years old`
                    : "Patient record synced from the API"}
                </p>
              </div>
              <div className="rounded-3xl border border-sahara-border/60 bg-white p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-sahara-muted">Primary Doctor</p>
                <p className="mt-2 font-serif text-3xl">{currentDoctor?.fullName ?? "Loading"}</p>
                <p className="mt-2 text-sm text-sahara-muted">{currentDoctor?.specialty ?? "Specialty will appear here"}</p>
              </div>
              <div className="rounded-3xl border border-sahara-border/60 bg-white p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-sahara-muted">Next Appointment</p>
                <p className="mt-2 font-serif text-3xl">{nextAppointment ? format(new Date(nextAppointment.startTime), "p") : "-"}</p>
                <p className="mt-2 text-sm text-sahara-muted">
                  {nextAppointment ? format(new Date(nextAppointment.startTime), "PP") : "No scheduled appointment"}
                </p>
              </div>
            </div>
          </div>

          <Card className="col-span-12 border border-sahara-border/40 bg-sahara-surface-low md:col-span-7">
            <CardContent className="p-8">
              <Camera className="size-9 text-sahara-primary" />
              <h3 className="mt-4 font-serif text-2xl">Visual AI Analysis</h3>
              <p className="mt-2 text-sahara-muted">
                Upload a skin or eye photo for instant pre-screening insights.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) setVisualFeedback(`${file.name} is ready. Open AI Scanners to run full image analysis.`);
                }}
              />
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl bg-sahara-fg px-5 py-3 text-sm font-semibold text-white"
                >
                  Upload Photo
                </button>
                <button
                  type="button"
                  onClick={() => setVisualFeedback("No previous visual analysis uploads found for this demo profile.")}
                  className="rounded-xl border border-sahara-border px-5 py-3 text-sm font-semibold"
                >
                  View History
                </button>
              </div>
              {visualFeedback ? <p className="mt-4 text-sm text-sahara-muted">{visualFeedback}</p> : null}
            </CardContent>
          </Card>

          <Card className="col-span-12 border border-sahara-tertiary/20 bg-[#d47070] text-[#3a2020] md:col-span-5">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-white/25">
                <AlertTriangle className="size-10" />
              </div>
              <h3 className="font-serif text-3xl">Emergency Help</h3>
              <p className="mx-auto mt-2 max-w-[260px] text-sm opacity-90">
                Instantly alert your care team and nearest medical services with your location.
              </p>
              <Link
                href="/patient/care-finder"
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-sahara-tertiary py-4 text-sm font-bold uppercase tracking-widest text-white"
              >
                Activate Emergency Protocol
              </Link>
            </CardContent>
          </Card>

          <Card className="col-span-12 border border-sahara-border/50">
            <CardHeader>
              <h3 className="font-serif text-3xl italic">Recent Insights</h3>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-2xl border border-sahara-border/40 bg-white p-5">
                <p className="font-semibold">Patient record</p>
                <p className="text-xs text-sahara-muted">{currentPatient?.id ?? "No patient loaded"}</p>
              </div>
              <div className="rounded-2xl border border-sahara-border/40 bg-white p-5">
                <p className="font-semibold">Primary doctor</p>
                <p className="text-xs text-sahara-muted">{currentDoctor?.email ?? "No doctor loaded"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <UpcomingAppointments />
          <PatientsPanel />
          <Card>
            <CardContent className="p-7">
              <HeartPulse className="size-8 text-sahara-primary" />
              <h3 className="mt-3 font-serif text-2xl">Provider verification</h3>
              <p className="mt-2 text-sm text-sahara-muted">Before sharing sensitive data, verify the provider.</p>
              <Link
                href="/provider/verification"
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-sahara-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-sahara-primary-2"
              >
                Verify Provider
              </Link>
              <p className="mt-4 text-xs text-sahara-muted">Synced appointment count: {summary.appointmentCount}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
