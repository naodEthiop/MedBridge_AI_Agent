"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { usePatients } from "@/hooks/usePatients";

export function PatientsPanel() {
  const { data, isLoading, error } = usePatients();

  return (
    <Card>
      <CardHeader>
        <h3 className="font-serif text-xl tracking-tight">Patients</h3>
        <p className="mt-2 text-sm leading-6 text-sahara-muted">Loaded dynamically from the API.</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-sahara-muted">Loading…</p>
        ) : error ? (
          <p className="text-sm text-sahara-tertiary">Failed to load.</p>
        ) : (
          <div className="grid gap-2">
            {(data ?? []).map((p) => (
              <Link
                key={p.id}
                href={`/doctor/patients/${encodeURIComponent(p.id)}`}
                className="rounded-2xl bg-sahara-surface-low p-4 ring-1 ring-sahara-border/60 hover:bg-sahara-surface transition-colors"
              >
                <p className="font-semibold">{p.fullName}</p>
                <p className="mt-1 text-sm text-sahara-muted">Patient ID: {p.id}</p>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

