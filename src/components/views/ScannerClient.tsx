"use client";

import { useRef, useState } from "react";

import { scanPrescription } from "@/lib/apiClient";
import { cleanErrorMessage } from "@/lib/userErrors";

export function ScannerClient() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await scanPrescription(file);
    setLoading(false);
    if (!res.ok) {
      const friendlyError = cleanErrorMessage(res.error ?? "Unable to scan. Please try again.");
      setError(friendlyError);
      return;
    }
    setResult(res.data as Record<string, unknown>);
  }

  const analysis = result?.analysis as Record<string, unknown> | undefined;

  return (
    <div className="grid gap-4">
      <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-sahara-border/60 bg-white p-4">
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="rounded-xl border border-sahara-border/70 px-3 py-2 text-sm font-semibold text-sahara-fg"
          >
            Select from Gallery
          </button>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="rounded-xl border border-sahara-border/70 px-3 py-2 text-sm font-semibold text-sahara-fg"
          >
            Take Photo
          </button>
          {file ? <p className="self-center text-xs text-sahara-muted">Selected: {file.name}</p> : null}
        </div>
        <button
          type="submit"
          disabled={!file || loading}
          className="inline-flex w-fit rounded-xl bg-sahara-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
        >
          {loading ? "Analyzing..." : "Analyze scan"}
        </button>
      </form>
      <div className="min-h-[240px] rounded-2xl border-2 border-dashed border-sahara-primary/35 bg-white p-5 shadow-inner">
        <div className="mt-4">
          {loading ? (
            <div className="space-y-4">
              <div className="animate-pulse space-y-2">
                <div className="h-6 w-2/3 rounded bg-sahara-border" />
                <div className="h-4 w-full rounded bg-sahara-border/80" />
                <div className="h-4 w-5/6 rounded bg-sahara-border/80" />
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm">
              <p className="font-semibold text-red-900">Unable to analyze</p>
              <p className="mt-1 text-red-800">Check your internet connection and try another image.</p>
            </div>
          ) : analysis ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-sahara-fg">{String(analysis.medicine ?? "Medication")}</h3>
                <p className="mt-1 text-xs text-sahara-muted">Confidence: {Math.round((Number(analysis.confidence) || 0) * 100)}%</p>
              </div>

              {analysis.summary ? (
                <div>
                  <h4 className="text-sm font-semibold text-sahara-fg">What is it used for?</h4>
                  <p className="mt-1 text-sm leading-relaxed text-sahara-fg">{String(analysis.summary)}</p>
                </div>
              ) : null}

              {analysis.dosage ? (
                <div>
                  <h4 className="text-sm font-semibold text-sahara-fg">How to take it</h4>
                  <p className="mt-1 text-sm leading-relaxed text-sahara-fg">{String(analysis.dosage)}</p>
                  {analysis.timing ? <p className="mt-1 text-sm text-sahara-muted">Timing: {String(analysis.timing)}</p> : null}
                </div>
              ) : null}

              {Array.isArray(analysis.usage) && analysis.usage.length ? (
                <div>
                  <h4 className="text-sm font-semibold text-sahara-fg">Important information</h4>
                  <ul className="mt-2 space-y-1">
                    {(analysis.usage as string[]).map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm text-sahara-fg">
                        <span className="text-sahara-primary">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {Array.isArray(analysis.warnings) && analysis.warnings.length ? (
                <div className="rounded-lg border border-red-200 bg-red-50/60 p-4">
                  <h4 className="text-sm font-semibold text-red-900">Safety Warnings</h4>
                  <ul className="mt-2 space-y-1">
                    {(analysis.warnings as string[]).map((warning, i) => (
                      <li key={i} className="flex gap-2 text-sm text-red-800">
                        <span className="text-red-600">⚠</span> {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  const drug = String(analysis.medicine ?? "Medication");
                  const reminders = JSON.parse(localStorage.getItem("med_reminders") || "[]");
                  reminders.push({ drug, time: new Date().toISOString(), active: true });
                  localStorage.setItem("med_reminders", JSON.stringify(reminders));
                  alert(`Reminder set for ${drug}. We'll notify you when it's time for your dose.`);
                }}
                className="w-full rounded-xl bg-sahara-primary px-4 py-3 font-semibold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
              >
                Set Reminder
              </button>
            </div>
          ) : (
            <p className="text-sm text-sahara-muted">
              {file
                ? "Tap 'Analyze scan' to see your medication details and safety information."
                : "Choose an image first. Your prescription analysis will display here."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

