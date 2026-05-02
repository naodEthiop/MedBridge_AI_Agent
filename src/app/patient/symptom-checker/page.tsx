"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Hospital } from "lucide-react";

import { BodySelector } from "@/components/ui/BodySelector";
import { SymptomCheckerClient } from "@/components/views/SymptomCheckerClient";

export default function SymptomCheckerPage() {
  const router = useRouter();
  const [triageResult, setTriageResult] = useState<Record<string, unknown> | null>(null);
  const [bodyPart, setBodyPart] = useState<null | "head" | "chest" | "stomach" | "back" | "arms" | "legs">(null);
  const urgency = String(triageResult?.urgency ?? "medium").toLowerCase();
  const recommendedSteps = Array.isArray(triageResult?.nextSteps)
    ? triageResult.nextSteps.filter((step): step is string => typeof step === "string")
    : ["Describe symptoms clearly", "Review AI triage", "Contact a clinician if symptoms worsen"];

  return (
    <div className="flex min-h-screen bg-sahara-bg text-sahara-fg lg:pl-64">
      <main className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-stone-200/60 bg-sahara-bg px-8 py-5 shadow-ambient">
          <h1 className="font-serif text-3xl">AI Symptom Checker</h1>
          <p className="mt-1 text-sm text-sahara-muted">Select a body area and send your symptom note for triage.</p>
        </header>

        <div className="grid flex-1 gap-8 p-8 xl:grid-cols-[1fr_24rem]">
          <div className="space-y-6">
            <BodySelector value={bodyPart} onChange={setBodyPart} />
            <SymptomCheckerClient onResultChange={setTriageResult} bodyPart={bodyPart} />
          </div>

          <aside className="space-y-6 rounded-3xl border border-sahara-border/60 bg-sahara-surface-low p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-sahara-muted">Urgency Status</p>
              <p className="mt-2 font-serif text-3xl capitalize">{urgency}</p>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-sahara-muted">Recommended Next Steps</p>
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
              Find Nearest Facility
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}
