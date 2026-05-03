"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowRight, CalendarDays, FlaskConical } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { triggerUiAction } from "@/lib/apiClient";
import type { Appointment } from "@/lib/server/repositories";

function getAge(dateOfBirth?: string) {
  if (!dateOfBirth) return null;
  return Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export function DoctorDashboardView() {
  const router = useRouter();
  const summary = useDashboardSummary();
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const patientRows = useMemo(
    () =>
      summary.patients.map((patient) => {
        const relatedAppointments = summary.appointments.filter((appointment: Appointment) => appointment.patientId === patient.id);
        const latestAppointment = relatedAppointments.slice().sort((a: Appointment, b: Appointment) => b.startTime.localeCompare(a.startTime))[0];
        const scheduled = relatedAppointments.some((appointment: Appointment) => appointment.status === "scheduled");

        return {
          patient,
          ageSex: `${getAge(patient.dateOfBirth) ?? "—"} / ${patient.sex.charAt(0).toUpperCase()}`,
          status: scheduled ? "Scheduled" : relatedAppointments.length ? "Review" : "Stable",
          lastVisit: latestAppointment ? format(new Date(latestAppointment.startTime), "PP") : "—",
        };
      }),
    [summary.appointments, summary.patients],
  );

  const handleReviewCharts = () => {
    const targetId = summary.patients[0]?.id;
    if (targetId) {
      router.push(`/doctor/patients/${encodeURIComponent(targetId)}`);
      return;
    }
    setFeedback("No patient selected to review yet.");
  };

  const handleNewConsultation = () => {
    router.push("/doctor/assistant");
  };

  const handleViewPatient = (patientId: string) => {
    router.push(`/doctor/patients/${encodeURIComponent(patientId)}`);
  };

  const handleRequestTelehealth = async () => {
    setActionLoading(true);
    setFeedback(null);
    const res = await triggerUiAction("doctor_request_telehealth", { doctorId: summary.currentDoctor?.id ?? null });
    setActionLoading(false);
    setFeedback(res.ok ? (res.data.message ?? "Telehealth call requested.") : "Could not request telehealth call.");
  };

  const handleExportLabRequisition = async () => {
    setActionLoading(true);
    setFeedback(null);
    const res = await triggerUiAction("doctor_export_lab_requisition", {
      patientId: summary.currentPatient?.id ?? null,
      doctorId: summary.currentDoctor?.id ?? null,
    });
    setActionLoading(false);
    setFeedback(res.ok ? (res.data.message ?? "Lab requisition export is ready.") : "Could not export lab requisition.");
  };

  const handleOpenPatientDetail = () => {
    const targetId = summary.patients[0]?.id;
    if (targetId) {
      router.push(`/doctor/patients/${encodeURIComponent(targetId)}`);
      return;
    }
    setFeedback("No patient available to open.");
  };

  return (
    <AppShell title="Doctor: Clinical Dashboard" subtitle="Stitch screen: Doctor: Clinical Dashboard">
      <div className="space-y-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-4xl leading-tight">Welcome back, {summary.currentDoctor?.fullName ?? "Dr. Aris"}</h2>
            <p className="mt-2 text-sahara-muted">
              You have {summary.appointmentCount} appointments and {summary.scheduledCount} scheduled today.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReviewCharts}
              disabled={actionLoading}
              className="rounded-xl border border-sahara-border/60 bg-white px-4 py-2 text-sm font-semibold text-sahara-fg transition hover:bg-sahara-surface-low disabled:opacity-50"
            >
              Review Charts
            </button>
            <button
              type="button"
              onClick={handleNewConsultation}
              disabled={actionLoading}
              className="rounded-xl bg-sahara-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-sahara-primary-2 disabled:opacity-50"
            >
              New Consultation
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <Card className="col-span-12 border border-sahara-border/30 shadow-ambient lg:col-span-8">
            <CardHeader className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl">Active Patient List</h3>
                <p className="mt-1 text-sm text-sahara-muted">Loaded dynamically from the API.</p>
              </div>
              <Badge tone={summary.loading ? "neutral" : "primary"}>{summary.loading ? "Loading" : "Live"}</Badge>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-sahara-border/50 text-xs uppercase tracking-widest text-sahara-muted">
                    <tr>
                      <th className="pb-3">Patient Name</th>
                      <th className="pb-3">Age/Sex</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Last Visit</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sahara-border/30">
                    {patientRows.map(({ patient, ageSex, status, lastVisit }) => (
                      <tr
                        key={patient.id}
                        onClick={() => handleViewPatient(patient.id)}
                        className="group cursor-pointer hover:bg-sahara-surface-low/60"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sahara-primary/20 text-xs font-bold text-sahara-primary">
                              {patient.fullName
                                .split(" ")
                                .slice(0, 2)
                                .map((part) => part[0]?.toUpperCase() ?? "")
                                .join("")}
                            </div>
                            <span className="font-semibold">{patient.fullName}</span>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-sahara-muted">{ageSex}</td>
                        <td className="py-4">
                          <span className="rounded-full border border-sahara-border/70 bg-sahara-surface-low px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                            {status}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-sahara-muted">{lastVisit}</td>
                        <td className="py-4 text-right">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleViewPatient(patient.id);
                            }}
                            className="inline-flex items-center text-sm font-bold text-sahara-primary"
                          >
                            Open <ArrowRight className="ml-1 h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="col-span-12 space-y-6 lg:col-span-4">
            <Card className="border border-sahara-border/30 shadow-ambient">
              <CardHeader>
                <h3 className="font-serif text-2xl">Clinical Alerts</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-[#c0392b]/20 bg-[#fce4e0] p-4">
                  <p className="text-sm font-bold text-[#7a1a10]">Critical monitor</p>
                  <p className="mt-1 text-xs text-[#7a1a10]">
                    {summary.currentPatient?.fullName ?? "No patient selected"} is the current focus patient.
                  </p>
                </div>
                <div className="rounded-2xl border border-yellow-300/50 bg-yellow-50 p-4">
                  <p className="text-sm font-bold text-yellow-900">Next appointment</p>
                  <p className="mt-1 text-xs text-yellow-800">
                    {summary.nextAppointment
                      ? `${summary.nextAppointment.reason ?? "Scheduled visit"} · ${format(new Date(summary.nextAppointment.startTime), "PPpp")}`
                      : "No scheduled appointment found."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-sahara-border/30 shadow-ambient">
              <CardHeader className="flex items-center justify-between">
                <h3 className="font-serif text-2xl">Appointments</h3>
                <CalendarDays className="h-5 w-5 text-sahara-muted" />
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {summary.appointments.slice(0, 3).map((appointment: Appointment) => {
                  const patient = summary.patients.find((entry) => entry.id === appointment.patientId);
                  return (
                    <div key={appointment.id}>
                      <p className="font-semibold">
                        {format(new Date(appointment.startTime), "HH:mm")} · {patient?.fullName ?? appointment.patientId}
                      </p>
                      <p className="text-sahara-muted">
                        {appointment.reason ?? "Scheduled appointment"} · {appointment.location ?? "TBD"}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <Card className="col-span-12 border border-sahara-border/30 bg-sahara-surface-low shadow-ambient lg:col-span-5">
            <CardContent className="p-8">
              <h4 className="font-serif text-2xl">Treatment Efficacy</h4>
              <div className="mt-5 flex h-32 items-end gap-2">
                {[40, 65, 55, 85, 75].map((h, idx) => (
                  <div key={idx} className="w-full rounded-t-lg bg-sahara-primary/70" style={{ height: `${h}%` }} />
                ))}
              </div>
              <p className="mt-4 text-sm text-sahara-muted">+12% positive outcomes this month.</p>
            </CardContent>
          </Card>

          <Card className="col-span-12 border border-sahara-border/30 shadow-ambient lg:col-span-3">
            <CardContent className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-sahara-tertiary/10 text-sahara-tertiary">
                <FlaskConical className="h-7 w-7" />
              </div>
              <h4 className="font-serif text-xl">Lab Results Pending</h4>
              <p className="my-2 font-serif text-4xl text-sahara-primary">14</p>
              <p className="text-xs uppercase tracking-widest text-sahara-muted">Awaiting verification</p>
            </CardContent>
          </Card>

          <Card className="col-span-12 border border-sahara-border/30 shadow-ambient lg:col-span-4">
            <CardContent className="p-8">
              <h4 className="font-serif text-2xl">Immediate Actions</h4>
              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={handleRequestTelehealth}
                  disabled={actionLoading}
                  className="rounded-lg border border-sahara-border bg-white px-4 py-3 text-xs font-bold uppercase tracking-widest text-sahara-fg hover:bg-sahara-surface-low disabled:opacity-50"
                >
                  Request Telehealth Call
                </button>
                <button
                  type="button"
                  onClick={handleExportLabRequisition}
                  disabled={actionLoading}
                  className="rounded-lg border border-sahara-border bg-white px-4 py-3 text-xs font-bold uppercase tracking-widest text-sahara-fg hover:bg-sahara-surface-low disabled:opacity-50"
                >
                  Export Lab Requisition
                </button>
                <button
                  type="button"
                  onClick={handleOpenPatientDetail}
                  disabled={actionLoading}
                  className="rounded-lg bg-sahara-primary px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
                >
                  Open Patient Detail
                </button>
              </div>
              {feedback ? <p className="mt-4 text-sm text-sahara-muted">{feedback}</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
