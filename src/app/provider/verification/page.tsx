"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { ProviderVerificationClient } from "@/components/views/ProviderVerificationClient";

export default function ProviderVerificationPage() {
  const router = useRouter();
  const [providerType, setProviderType] = useState<"physician" | "specialist">("physician");

  return (
    <AppShell title="Provider Verification" subtitle="Stitch screen: Provider Verification">
      <div className="space-y-10">
        <section className="mx-auto max-w-2xl">
          <div className="mb-8 flex items-center justify-between">
            <div className="h-0.5 flex-1 bg-sahara-border" />
            <div className="mx-4 h-0.5 w-1/2 bg-sahara-primary" />
            <div className="h-0.5 flex-1 bg-sahara-border" />
          </div>
          <h1 className="font-serif text-5xl leading-tight">Finalizing Your Professional Profile</h1>
          <p className="mt-4 text-lg text-sahara-muted">
            To maintain clinical excellence, all practitioners submit valid credentials. Data is encrypted and used for
            verification only.
          </p>
        </section>

        <div className="grid gap-10 lg:grid-cols-12">
          <section className="space-y-8 lg:col-span-7">
            <div className="space-y-6 rounded-xl border border-sahara-border/40 bg-sahara-surface-low p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setProviderType("physician")}
                  className={`rounded-lg border-2 px-6 py-4 font-bold ${
                    providerType === "physician"
                      ? "border-sahara-primary bg-sahara-primary/5 text-sahara-primary"
                      : "border-sahara-border bg-white text-sahara-muted"
                  }`}
                >
                  Physician (MD/DO)
                </button>
                <button
                  type="button"
                  onClick={() => setProviderType("specialist")}
                  className={`rounded-lg border-2 px-6 py-4 font-bold ${
                    providerType === "specialist"
                      ? "border-sahara-primary bg-sahara-primary/5 text-sahara-primary"
                      : "border-sahara-border bg-white text-sahara-muted"
                  }`}
                >
                  Specialist / Resident
                </button>
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-sahara-muted">
                Selected path: {providerType === "physician" ? "Physician" : "Specialist / Resident"}
              </p>
              <ProviderVerificationClient />
            </div>

            <div className="flex items-center justify-between gap-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="font-bold text-sahara-muted hover:text-sahara-primary"
              >
                Back to Identity
              </button>
              <button
                type="submit"
                form="provider-verification-form"
                className="rounded-lg bg-sahara-primary px-10 py-4 text-lg font-bold text-white shadow-lg"
              >
                Submit for Verification
              </button>
            </div>
          </section>

          <aside className="space-y-6 lg:col-span-5">
            <div className="overflow-hidden rounded-xl border border-sahara-border shadow-sm">
              <img
                className="h-48 w-full object-cover opacity-80 mix-blend-multiply"
                alt="Credential"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKBoyU8zLXKrFrA34BBqcJOPgLtRlfjMpBIpKSDBpVhVQluUC2u5A5tOY2nycxf7VQ15WA92D2Mp-f8H0fRJ7bOxjYGo_eHEzyvisqZqM1DZfxHjR81htpeZu5_ye1EzwsFEynqYdwJLd6b5rZlq8cjMEcPXmhkQyl1_O3dbmx8ij36MIvsEvE8rZbHRK7QH1iumWiyer8phJP4aV6XrJyFhw8iYDmPLmtlWfx7EhFFzpDALEZeBZ-pGaxzeScjFVUxkgCxfYuJnw"
              />
              <div className="p-6">
                <h4 className="font-serif text-lg">Trust & Safety</h4>
                <p className="mt-2 text-sm text-sahara-muted">
                  License data is stored in an encrypted vault and reviewed only by compliance officers.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#d47070]/20 bg-[#fce0e0]/40 p-6">
              <h5 className="text-sm font-bold uppercase tracking-widest text-[#6e3030]">Common Rejection Reasons</h5>
              <ul className="mt-2 space-y-1 text-sm text-[#6e3030]/80">
                <li>Expired document dates</li>
                <li>Mismatch in legal name</li>
                <li>Unreadable uploads</li>
              </ul>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-sahara-border/40 bg-sahara-surface-high p-6">
              <div>
                <h5 className="text-sm font-bold uppercase tracking-widest">Review Time</h5>
                <p className="text-xs text-sahara-muted">Average turnaround: 24-48 hours</p>
              </div>
              <span className="text-sahara-muted">{">"}</span>
            </div>
            <p className="text-xs text-sahara-muted">Live verification endpoint is already connected via API route.</p>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
