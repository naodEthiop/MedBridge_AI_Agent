"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, CalendarDays, FlaskConical } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";

function getAge(dateOfBirth?: string) {
  if (!dateOfBirth) return null;
  return Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export default function DoctorDashboardPage() {
  const summary = useDashboardSummary();
  const displayDoctor = summary.currentDoctor?.fullName ?? "Dr. Aris";
  const patientRows = summary.patients.map((patient) => {
    const relatedAppointments = summary.appointments.filter((appointment) => appointment.patientId === patient.id);
    const latestAppointment = relatedAppointments.slice().sort((a, b) => b.startTime.localeCompare(a.startTime))[0];
    const scheduled = relatedAppointments.some((appointment) => appointment.status === "scheduled");

    return {
      patient,
      ageSex: `${getAge(patient.dateOfBirth) ?? "—"} / ${patient.sex.charAt(0).toUpperCase()}`,
      status: scheduled ? "Scheduled" : relatedAppointments.length ? "Review" : "Stable",
      lastVisit: latestAppointment ? format(new Date(latestAppointment.startTime), "PP") : "—",
    };
  });

  return (
    <AppShell title="Doctor: Clinical Dashboard" subtitle="Stitch screen: Doctor: Clinical Dashboard">
      <div className="space-y-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-4xl leading-tight">Welcome back, {displayDoctor}</h2>
            <p className="mt-2 text-sahara-muted">
              You have {summary.appointmentCount} appointments and {summary.scheduledCount} scheduled today.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-xl border border-sahara-border/60 bg-white px-4 py-2 text-sm font-semibold">
              Review Charts
            </button>
            <button className="rounded-xl bg-sahara-primary px-4 py-2 text-sm font-semibold text-white">
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
                      <tr key={patient.id} className="group hover:bg-sahara-surface-low/40">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 items-center justify-center rounded-full bg-sahara-primary/20 text-xs font-bold text-sahara-primary">
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
                          <Link
                            href={`/doctor/patients/${encodeURIComponent(patient.id)}`}
                            className="inline-flex items-center text-sm font-bold text-sahara-primary"
                          >
                            Open <ArrowRight className="ml-1 size-4" />
                          </Link>
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
                <CalendarDays className="size-5 text-sahara-muted" />
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {summary.appointments.slice(0, 3).map((appointment) => {
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
              <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-sahara-tertiary/10 text-sahara-tertiary">
                <FlaskConical className="size-7" />
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
                <button className="rounded-lg border border-sahara-border bg-white px-4 py-3 text-xs font-bold uppercase tracking-widest text-sahara-fg hover:bg-sahara-surface-low">
                  Request Telehealth Call
                </button>
                <button className="rounded-lg border border-sahara-border bg-white px-4 py-3 text-xs font-bold uppercase tracking-widest text-sahara-fg hover:bg-sahara-surface-low">
                  Export Lab Requisition
                </button>
                <Link
                  href="/doctor/patients/pat_1"
                  className="rounded-lg bg-sahara-primary px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-white"
                >
                  Open Patient Detail
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

