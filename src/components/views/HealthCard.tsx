"use client";

import { format } from "date-fns";

import { Badge } from "@/components/ui/Badge";
import { usePatient } from "@/hooks/usePatient";

export function HealthCard(props: { patientId: string }) {
  const q = usePatient(props.patientId);

  if (q.isLoading) {
    return <p className="text-sm text-sahara-muted">Loading…</p>;
  }
  if (q.error || !q.data) {
    return <p className="text-sm text-sahara-tertiary">Failed to load patient card.</p>;
  }

  const p = q.data.patient;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-sahara-surface to-sahara-surface-low p-6 ring-1 ring-sahara-border/60 shadow-ambient">
      <div className="rounded-[28px] bg-sahara-card p-7 ring-1 ring-sahara-border/60">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-sahara-muted">MedBridge Digital Health Card</p>
            <h3 className="mt-2 font-serif text-2xl tracking-tight">{p.fullName}</h3>
            <p className="mt-1 text-sm text-sahara-muted">
              DOB: {p.dateOfBirth ? format(new Date(p.dateOfBirth), "PP") : "—"} · Sex: {p.sex}
            </p>
          </div>
          <Badge tone="primary">Verified</Badge>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-sahara-surface-low p-4 ring-1 ring-sahara-border/60">
            <p className="text-xs font-semibold tracking-wide text-sahara-muted">Patient ID</p>
            <p className="mt-2 font-semibold">{p.id}</p>
          </div>
          <div className="rounded-2xl bg-sahara-surface-low p-4 ring-1 ring-sahara-border/60">
            <p className="text-xs font-semibold tracking-wide text-sahara-muted">Contact</p>
            <p className="mt-2 text-sm text-sahara-fg">{p.email ?? "—"}</p>
            <p className="mt-1 text-sm text-sahara-fg">{p.phone ?? "—"}</p>
          </div>
          <div className="rounded-2xl bg-sahara-surface-low p-4 ring-1 ring-sahara-border/60 sm:col-span-2">
            <p className="text-xs font-semibold tracking-wide text-sahara-muted">Key flags</p>
            <p className="mt-2 text-sm text-sahara-fg">
              Allergies: {p.allergies?.length ? p.allergies.join(", ") : "None"} · Conditions:{" "}
              {p.conditions?.length ? p.conditions.join(", ") : "None"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

