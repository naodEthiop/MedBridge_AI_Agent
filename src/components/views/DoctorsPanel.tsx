"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useDoctors } from "@/hooks/useDoctors";

export function DoctorsPanel() {
  const { data, isLoading, error } = useDoctors();

  return (
    <Card>
      <CardHeader>
        <h3 className="font-serif text-xl tracking-tight">Doctors</h3>
        <p className="mt-2 text-sm leading-6 text-sahara-muted">Loaded dynamically from the API.</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-sahara-muted">Loading…</p>
        ) : error ? (
          <p className="text-sm text-sahara-tertiary">Failed to load.</p>
        ) : (
          <div className="grid gap-2">
            {(data ?? []).map((d) => (
              <div key={d.id} className="rounded-2xl bg-sahara-surface-low p-4 ring-1 ring-sahara-border/60">
                <p className="font-semibold">{d.fullName}</p>
                <p className="mt-1 text-sm text-sahara-muted">{d.specialty}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

