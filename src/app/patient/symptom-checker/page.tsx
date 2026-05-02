"use client";

import { CheckCircle2, Hospital, Settings } from "lucide-react";
import { useState } from "react";

import { BodySelector } from "@/components/ui/BodySelector";
import { SymptomCheckerClient } from "@/components/views/SymptomCheckerClient";

export default function SymptomCheckerPage() {
  const [triageResult, setTriageResult] = useState<Record<string, unknown> | null>(null);
  const [bodyPart, setBodyPart] = useState<null | "head" | "chest" | "stomach" | "back" | "arms" | "legs">(null);
  const urgency = String(triageResult?.urgency ?? "medium").toLowerCase();
  const urgencyLabel = urgency === "urgent" ? "High" : urgency === "low" ? "Low" : "Medium-High";
  const urgencyClass =
    urgency === "urgent"
      ? "border-red-300/40 bg-red-100/60"
      : urgency === "low"
        ? "border-emerald-300/40 bg-emerald-100/60"
        : "border-sahara-tertiary/20 bg-[#fce0e0]";
  const confidenceValue = Number(triageResult?.confidence ?? 0.68);
  const confidencePct = Number.isFinite(confidenceValue) ? Math.max(0, Math.min(100, Math.round(confidenceValue * 100))) : 68;
  const nearestHospital =
    triageResult?.nearestHospital && typeof triageResult.nearestHospital === "object"
      ? (triageResult.nearestHospital as { name?: string; distanceKm?: number })
      : null;
  const recommendedAction = String(triageResult?.recommendedAction ?? "Consult an Urgent Care within 4 hours");
  const followUps = Array.isArray(triageResult?.followUpQuestions)
    ? triageResult.followUpQuestions.filter((q): q is string => typeof q === "string")
    : [];
  const redFlags = Array.isArray(triageResult?.redFlags)
    ? triageResult.redFlags.filter((f): f is string => typeof f === "string")
    : [];
  const recommendedSteps = [
    ...redFlags.slice(0, 2),
    recommendedAction,
    ...followUps.slice(0, 1),
  ].filter(Boolean);

  return (
    <div className="flex min-h-screen bg-sahara-bg text-sahara-fg lg:pl-64">
      <main className="flex h-screen flex-1 flex-col">
        <header className="sticky top-0 z-40 w-full border-b border-stone-200/60 bg-sahara-bg shadow-ambient">
          <div className="mx-auto flex h-20 w-full max-w-[1920px] items-center justify-between px-8">
            <div className="flex flex-1 items-center gap-6">
              <div className="relative w-96 max-w-full">
                <input
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm transition-all focus:border-sahara-primary focus:ring-1 focus:ring-sahara-primary"
                  placeholder="Search medical history..."
                  type="text"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Settings className="size-5 cursor-pointer text-stone-500 transition-colors hover:text-sahara-primary" />
              <div className="size-10 overflow-hidden rounded-full border-2 border-white bg-stone-200 shadow-sm">
                <img
                  alt="User profile"
                  className="h-full w-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDA5OiZT0jZLYcbLcUzxRi3b5x7jca2ttrREZ1FB0hdMKyxqaB6u7km4EXqMUIinDC86ALdpq58YijBzvYqhGjBhJxXKRSytDmk067pgpYZ2ZpYge3pz8J9fgkNN9wuU9asLIhkJ4xYJx6aYkU8hMpM7UbIoF4bINmwXUUzU-F62BzGCcorVBmTNYez2keUV4jAKPnRkh4AdFYnQghrGNLva_BYP8xeTUYwVbj4vcf-Jh87bEpX68kMRnWP0-2LMG7TfHFp_7RtA08"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto w-full max-w-4xl space-y-6">
              <BodySelector value={bodyPart} onChange={setBodyPart} />
              <SymptomCheckerClient onResultChange={setTriageResult} bodyPart={bodyPart} />
            </div>
          </div>

          <aside className="hidden w-96 space-y-8 overflow-y-auto border-l border-stone-200/60 bg-sahara-surface-low p-8 xl:block">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl">AI Analysis</h2>
                <span className="rounded-full bg-sahara-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sahara-primary">
                  Live Scan
                </span>
              </div>
              <div className={`flex items-center gap-4 rounded-2xl border p-4 ${urgencyClass}`}>
                <div className="flex size-12 items-center justify-center rounded-full bg-sahara-tertiary/20 text-sahara-tertiary">
                  <Hospital className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#6e3030]">Urgency Status</p>
                  <p className="font-semibold text-[#3a2020]">{urgencyLabel}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Potential Conditions</p>
              <div className="space-y-3">
                <div className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm">
                  <div className="mb-2 flex items-start justify-between">
                    <h4 className="font-semibold">Primary AI Assessment</h4>
                    <span className="text-sm font-bold text-sahara-primary">{confidencePct}% Match</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                    <div className="h-full bg-sahara-primary" style={{ width: `${confidencePct}%` }} />
                  </div>
                  <p className="mt-3 text-xs italic text-stone-500">
                    {String(triageResult?.message ?? "Initial screening suggests a focused abdominal assessment.")}
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-100 bg-white p-5 opacity-70 shadow-sm">
                  <div className="mb-2 flex items-start justify-between">
                    <h4 className="font-semibold">{nearestHospital?.name ? "Nearest Facility" : "Clinical Review"}</h4>
                    <span className="text-sm font-bold text-stone-400">
                      {nearestHospital?.distanceKm != null ? `${nearestHospital.distanceKm} km` : "Pending"}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                    <div className="h-full w-[24%] bg-stone-300" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Recommended Next Steps</p>
              <div className="space-y-2">
                {(recommendedSteps.length
                  ? recommendedSteps
                  : [
                      "Avoid eating or drinking until examined",
                      "Monitor for fever or vomiting",
                      "Consult an Urgent Care within 4 hours",
                    ]
                ).map((step) => (
                  <div key={step} className="flex items-start gap-3 rounded-xl border border-stone-100 bg-white/50 p-3">
                    <CheckCircle2 className="mt-0.5 size-4 text-sahara-primary" />
                    <span className="text-sm text-sahara-fg">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sahara-fg py-4 font-semibold text-white transition-colors hover:bg-stone-800">
                <Hospital className="size-5" />
                Find Nearest Facility
              </button>
              <p className="mt-4 px-4 text-center text-[10px] leading-normal text-stone-400">
                Your data is encrypted and shared only with your chosen providers.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

