"use client";

import Link from "next/link";
import { format } from "date-fns";
import { CalendarPlus } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useAppointments } from "@/hooks/useAppointments";
import { useDoctors } from "@/hooks/useDoctors";
import { triggerUiAction } from "@/lib/apiClient";
import type { Appointment } from "@/lib/server/repositories";

export default function PatientAppointmentsPage() {
  const appts = useAppointments();
  const doctors = useDoctors();
  const [booking, setBooking] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loading = appts.isLoading || doctors.isLoading;
  const error = appts.error || doctors.error;

  const doctorMap = new Map((doctors.data ?? []).map((d) => [d.id, d]));

  const scheduled = (appts.data ?? [])
    .filter((a: Appointment) => a.status === "scheduled")
    .slice()
    .sort((a: Appointment, b: Appointment) => a.startTime.localeCompare(b.startTime));


  const handleBook = async () => {
    setBooking(true);
    setFeedback(null);
    const res = await triggerUiAction("patient_appointment_request", { channel: "in-app" });
    setBooking(false);
    setFeedback(res.ok ? (res.data.message ?? "Request sent to your care team.") : "Request failed.");
  };

  return (
    <AppShell title="Appointments" subtitle="Your visits and scheduling">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-sahara-muted">Upcoming visits pulled from your care record and synced in real time.</p>
          <div className="flex flex-wrap gap-2">
                        <button
              type="button"
              disabled={booking}
              onClick={handleBook}
              className="inline-flex items-center gap-2 rounded-xl bg-sahara-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <CalendarPlus className="size-4" />
              {booking ? "Sending…" : "Request appointment"}
            </button>
          </div>
        </div>
        {feedback ? <p className="text-sm text-sahara-muted">{feedback}</p> : null}

        <Card>
          <CardHeader>
            <h2 className="font-serif text-2xl">Scheduled visits</h2>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-sahara-muted">Loading…</p>
            ) : error ? (
              <p className="text-sm text-sahara-tertiary">Could not load appointments.</p>
            ) : scheduled.length === 0 ? (
              <p className="text-sm text-sahara-muted">No upcoming appointments. Request one above or contact your clinic.</p>
            ) : (
              <ul className="space-y-3">
                {scheduled.map((a: Appointment) => {
                  const doc = doctorMap.get(a.doctorId);
                  return (
                    <li key={a.id} className="rounded-2xl border border-sahara-border/60 bg-sahara-surface-low/60 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{a.reason ?? "Visit"}</p>
                          <p className="mt-1 text-sm text-sahara-muted">
                            {format(new Date(a.startTime), "PPpp")} — {doc?.fullName ?? "Clinician"}
                          </p>
                          {a.location ? <p className="mt-1 text-xs text-sahara-muted">{a.location}</p> : null}
                        </div>
                        <Badge tone="primary">{a.status}</Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-sahara-muted">
          <Link href="/patient" className="font-semibold text-sahara-primary hover:underline">
            Back to dashboard
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
