"use client";

import { useRef, useState } from "react";

import { scanPrescription } from "@/lib/apiClient";

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
      setError(typeof res.error === "string" ? res.error : "Scan failed. Check GEMINI_API_KEY and try another image.");
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
      <div className="min-h-[220px] rounded-2xl border-2 border-dashed border-sahara-primary/35 bg-white p-5 shadow-inner">
        <p className="text-xs font-bold uppercase tracking-widest text-sahara-primary">MedBridge AI API response</p>
        <p className="mt-1 text-xs text-sahara-muted">
          Structured output from <code className="rounded bg-sahara-surface-low px-1">/api/prescription</code> appears here.
          Swap this client for your backend URL when integrating.
        </p>
        <div className="mt-4">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 w-[68%] rounded bg-sahara-border" />
              <div className="h-3 w-full rounded bg-sahara-border/80" />
              <div className="h-3 w-5/6 rounded bg-sahara-border/80" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-900">
              <p className="font-semibold">Error</p>
              <p className="mt-1">{error}</p>
            </div>
          ) : analysis ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-sahara-surface-low p-4 ring-1 ring-sahara-border/60">
                <p className="font-semibold">Detected: {String(analysis.detected)}</p>
                <p className="text-sm text-sahara-muted">Confidence: {String(analysis.confidence ?? "—")}</p>
                <p className="text-sm text-sahara-muted">Medicine: {String(analysis.medicine ?? "N/A")}</p>
                <p className="text-sm text-sahara-muted">Dosage: {String(analysis.dosage ?? "N/A")}</p>
                <p className="text-sm text-sahara-muted">Timing: {String(analysis.timing ?? "N/A")}</p>
                {analysis.summary ? (
                  <p className="mt-3 text-sm leading-relaxed text-sahara-fg">
                    <span className="font-semibold">Summary:</span> {String(analysis.summary)}
                  </p>
                ) : null}
                {Array.isArray(analysis.usage) && analysis.usage.length ? (
                  <p className="mt-2 text-sm text-sahara-muted">Usage: {analysis.usage.join(" · ")}</p>
                ) : null}
                {Array.isArray(analysis.warnings) && analysis.warnings.length ? (
                  <p className="mt-2 text-sm text-sahara-tertiary">Warnings: {analysis.warnings.join(" · ")}</p>
                ) : null}
              </div>
              <details className="rounded-xl border border-sahara-border/50 bg-stone-50/80 p-3">
                <summary className="cursor-pointer text-xs font-semibold text-sahara-muted">Raw JSON (debug)</summary>
                <pre className="mt-2 max-h-48 overflow-auto text-[11px] leading-relaxed text-sahara-fg">
                  {JSON.stringify(result ?? {}, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <p className="text-sm text-sahara-muted">
              {file
                ? "Tap “Analyze scan” to send the image to MedBridge AI and show the response here."
                : "Choose an image first. Your prescription analysis will display in this panel."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

