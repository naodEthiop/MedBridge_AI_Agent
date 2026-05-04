"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ScannerClient } from "@/components/views/ScannerClient";

export default function ScannersPage() {
  return (
    <AppShell title="Medication scanner" subtitle="Prescription image · MedBridge AI analysis">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <h2 className="font-serif text-4xl leading-tight md:text-5xl">Medication scanner</h2>
          <p className="mt-4 max-w-2xl text-lg text-sahara-muted">
            Capture or upload a prescription label. Results from the MedBridge AI-powered API appear in the response panel below.
          </p>
        </header>

        <section className="rounded-3xl border border-sahara-border/40 bg-sahara-surface-low p-8 shadow-ambient">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-serif text-2xl">Scan prescription</h3>
            <span className="rounded-full bg-sahara-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sahara-primary">
              MedBridge AI
            </span>
          </div>
          <ScannerClient />
        </section>
      </div>
    </AppShell>
  );
}
