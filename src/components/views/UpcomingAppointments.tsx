"use client";

import Link from "next/link";
import { format } from "date-fns";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useAppointments } from "@/hooks/useAppointments";
import { useDoctors } from "@/hooks/useDoctors";
import { usePatients } from "@/hooks/usePatients";

function byId<T extends { id: string }>(items: T[]) {
  return new Map(items.map((i) => [i.id, i]));
}

export function UpcomingAppointments() {
  const appts = useAppointments();
  const patients = usePatients();
  const doctors = useDoctors();

  const loading = appts.isLoading || patients.isLoading || doctors.isLoading;
  const error = appts.error || patients.error || doctors.error;

  const patientMap = byId(patients.data ?? []);
  const doctorMap = byId(doctors.data ?? []);

  const upcoming = (appts.data ?? [])
    .filter((a) => a.status === "scheduled")
    .slice()
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <h2 className="font-serif text-xl tracking-tight">Upcoming appointments</h2>
        <p className="mt-2 text-sm leading-6 text-sahara-muted">Bound to appointments + doctors + patients data.</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-sahara-muted">Loading…</p>
        ) : error ? (
          <p className="text-sm text-sahara-tertiary">Failed to load appointments.</p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-sahara-muted">No upcoming appointments.</p>
        ) : (
          <div className="grid gap-3">
            {upcoming.map((a) => {
              const patient = patientMap.get(a.patientId);
              const doctor = doctorMap.get(a.doctorId);
              return (
                <div
                  key={a.id}
                  className="rounded-3xl bg-sahara-surface-low p-6 ring-1 ring-sahara-border/60"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {patient?.fullName ?? a.patientId} · {doctor?.fullName ?? a.doctorId}
                      </p>
                      <p className="mt-1 text-sm text-sahara-muted">
                        {format(new Date(a.startTime), "PPpp")} — {format(new Date(a.endTime), "p")}
                      </p>
                      {a.location ? (
                        <p className="mt-1 text-sm text-sahara-muted">{a.location}</p>
                      ) : null}
                    </div>
                    <Badge tone="primary">Scheduled</Badge>
                  </div>
                  {a.reason ? <p className="mt-3 text-sm text-sahara-fg">{a.reason}</p> : null}
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-4 border-t border-sahara-border/50 pt-4">
          <Link
            href="/patient/appointments"
            className="inline-flex w-full items-center justify-center rounded-xl bg-sahara-primary py-2.5 text-sm font-semibold text-white hover:bg-sahara-primary-2"
          >
            View all and schedule
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

