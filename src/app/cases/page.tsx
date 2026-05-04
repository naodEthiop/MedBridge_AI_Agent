"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetchJson, normalizeCaseRow, type CaseItemNormalized } from "@/lib/api/client";

type CaseItem = CaseItemNormalized;

export default function CasesPage() {
  const [items, setItems] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await apiFetchJson<{ ok?: boolean; cases?: Record<string, unknown>[] }>("/api/cases?limit=20", {
          cache: "no-store",
        });
        if (!result.success) {
          if (result.status === 401) throw new Error("Sign in to view your cases.");
          throw new Error(result.error);
        }
        const rows = result.data.cases ?? [];
        setItems(rows.map((row) => normalizeCaseRow(row)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load cases");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cases</h1>
        <Link className="text-sm text-sahara-primary hover:underline" href="/patient/symptom-checker">
          New triage
        </Link>
      </div>
      {loading && <p className="text-sm text-sahara-muted">Loading cases...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-sahara-muted">No cases found.</p>
          ) : (
            items.map((item) => (
              <article key={item.id} className="rounded-xl border border-sahara-border bg-white p-4">
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-medium">{item.symptoms}</p>
                  <span className="text-xs uppercase text-sahara-muted">{item.urgency}</span>
                </div>
                <p className="text-sm text-sahara-muted">{item.doctorSummary}</p>
                <p className="mt-2 text-xs text-sahara-muted">{new Date(item.createdAt).toLocaleString()}</p>
              </article>
            ))
          )}
        </div>
      )}
    </main>
  );
}
