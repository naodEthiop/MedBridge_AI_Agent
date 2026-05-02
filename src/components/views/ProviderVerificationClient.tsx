"use client";

import { useState } from "react";

import { verifyProvider } from "@/lib/apiClient";

export function ProviderVerificationClient() {
  const [providerName, setProviderName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [clinic, setClinic] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await verifyProvider({ providerName, licenseNumber, clinic });
    setLoading(false);
    if (res.ok) setResult(res.data as Record<string, unknown>);
  }

  return (
    <div className="grid gap-4">
      <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-sahara-border/60 bg-white p-5 sm:grid-cols-2">
        <input
          value={providerName}
          onChange={(e) => setProviderName(e.target.value)}
          placeholder="Provider name"
          className="rounded-xl border border-sahara-border/70 px-3 py-2 text-sm outline-none focus:border-sahara-primary"
        />
        <input
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          placeholder="License number"
          className="rounded-xl border border-sahara-border/70 px-3 py-2 text-sm outline-none focus:border-sahara-primary"
        />
        <input
          value={clinic}
          onChange={(e) => setClinic(e.target.value)}
          placeholder="Clinic"
          className="rounded-xl border border-sahara-border/70 px-3 py-2 text-sm outline-none focus:border-sahara-primary sm:col-span-2"
        />
        <button
          disabled={loading}
          className="rounded-xl bg-sahara-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-70 sm:col-span-2"
        >
          {loading ? "Verifying..." : "Verify provider"}
        </button>
      </form>

      {result ? (
        <div className="rounded-2xl bg-sahara-surface-low p-5 ring-1 ring-sahara-border/60">
          <p className="font-semibold">Status: {String(result.status)}</p>
          <p className="mt-1 text-sm text-sahara-muted">Verified: {String(result.verified)}</p>
        </div>
      ) : null}
    </div>
  );
}

