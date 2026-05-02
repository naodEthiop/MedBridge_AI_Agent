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
    const res = await scanPrescription(file);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
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
          disabled={!file || loading}
          className="inline-flex w-fit rounded-xl bg-sahara-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
        >
          {loading ? "Analyzing..." : "Analyze scan"}
        </button>
      </form>
      {error ? <p className="text-sm text-sahara-tertiary">{error}</p> : null}
      {analysis ? (
        <div className="rounded-2xl bg-sahara-surface-low p-5 ring-1 ring-sahara-border/60">
          <p className="font-semibold">Detected: {String(analysis.detected)}</p>
          <p className="text-sm text-sahara-muted">Medicine: {String(analysis.medicine ?? "N/A")}</p>
          <p className="text-sm text-sahara-muted">Dosage: {String(analysis.dosage ?? "N/A")}</p>
          <p className="text-sm text-sahara-muted">Timing: {String(analysis.timing ?? "N/A")}</p>
          {Array.isArray(analysis.usage) && analysis.usage.length ? (
            <p className="mt-2 text-sm text-sahara-muted">Usage: {analysis.usage.join(" · ")}</p>
          ) : null}
          {Array.isArray(analysis.warnings) && analysis.warnings.length ? (
            <p className="mt-2 text-sm text-sahara-tertiary">Warnings: {analysis.warnings.join(" · ")}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

