"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { CheckCircle2, Hospital } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { BodySelector } from "@/components/ui/BodySelector";
import { SymptomCheckerClient } from "@/components/views/SymptomCheckerClient";

function SymptomCheckerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [triageResult, setTriageResult] = useState<Record<string, unknown> | null>(null);
  const [bodyPart, setBodyPart] = useState<null | "head" | "chest" | "stomach" | "back" | "arms" | "legs">(null);
  const qFromSearch = searchParams.get("q")?.trim() ?? "";

  const urgency = String(triageResult?.urgency ?? "medium").toLowerCase();
  const recommendedSteps = Array.isArray(triageResult?.nextSteps)
    ? triageResult.nextSteps.filter((step): step is string => typeof step === "string")
    : ["Describe symptoms clearly", "Review AI triage", "Contact a clinician if symptoms worsen"];

  return (
    <AppShell title="AI Symptom Checker" subtitle="Body map + triage assistant">
      <div className="grid gap-8 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <BodySelector value={bodyPart} onChange={setBodyPart} />
          <SymptomCheckerClient
            key={qFromSearch || "symptom-check"}
            onResultChange={setTriageResult}
            bodyPart={bodyPart}
            initialMessage={qFromSearch}
          />
        </div>

        <aside className="space-y-6 rounded-3xl border border-sahara-border/60 bg-sahara-surface-low p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-sahara-muted">Urgency status</p>
            <p className="mt-2 font-serif text-3xl capitalize">{urgency}</p>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-sahara-muted">Recommended next steps</p>
            {recommendedSteps.map((step) => (
              <div key={step} className="flex items-start gap-3 rounded-xl border border-stone-100 bg-white/70 p-3">
                <CheckCircle2 className="mt-0.5 size-4 text-sahara-primary" />
                <span className="text-sm">{step}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => router.push("/patient/care-finder")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sahara-fg py-4 font-semibold text-white transition-colors hover:bg-stone-800"
          >
            <Hospital className="size-5" />
            Find nearest facility
          </button>
        </aside>
      </div>
    </AppShell>
  );
}

export default function SymptomCheckerPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] p-8 text-sahara-muted">Loading symptom checker…</div>}>
      <SymptomCheckerInner />
    </Suspense>
  );
}
