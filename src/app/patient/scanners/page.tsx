"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ScannerClient } from "@/components/views/ScannerClient";
import { analyzeImage, triggerUiAction } from "@/lib/apiClient";
import { useRef, useState } from "react";

export default function ScannersPage() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [dermFile, setDermFile] = useState<File | null>(null);
  const [dermLoading, setDermLoading] = useState(false);
  const [dermResult, setDermResult] = useState<Record<string, unknown> | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function toBase64(file: File) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }

  async function analyzeDermScan() {
    if (!dermFile) return;
    setDermLoading(true);
    setFeedback(null);
    const res = await analyzeImage({
      kind: "derm",
      mimeType: dermFile.type || "image/jpeg",
      base64Data: await toBase64(dermFile),
      hintText: `Filename: ${dermFile.name}`,
    });
    setDermLoading(false);
    if (!res.ok) {
      setFeedback("Dermatology scan failed. Please try another image.");
      setDermResult(null);
      return;
    }
    const payload = (res.data as { result?: Record<string, unknown> }).result ?? (res.data as Record<string, unknown>);
    setDermResult(payload);
    setFeedback("Dermatology scan analyzed with Gemini successfully.");
  }

  async function runAction(action: string) {
    const res = await triggerUiAction(action, { source: "dermatology-scanner" });
    setFeedback(res.ok ? (res.data.message ?? "Action completed.") : "Action failed. Please retry.");
  }

  return (
    <AppShell title="AI Scanners" subtitle="Stitch screen: Patient: AI Scanners">
      <div className="space-y-8">
        <header>
          <h2 className="font-serif text-5xl leading-tight">Unified AI Analysis</h2>
          <p className="mt-4 max-w-2xl text-lg text-sahara-muted">
            Harness computer vision for immediate drug verification and dermatological triage powered by MedBridge AI.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-3xl border border-sahara-border/40 bg-sahara-surface-low p-8 shadow-ambient">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="font-serif text-3xl">Medication Scanner</h3>
              <span className="rounded-full bg-sahara-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sahara-primary">
                Active
              </span>
            </div>

            <div className="relative mb-8 aspect-video overflow-hidden rounded-2xl border-2 border-dashed border-sahara-border bg-[#e6e0d6]">
              <img
                alt="Medicine bottle"
                className="h-full w-full object-cover opacity-60 mix-blend-multiply"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1g_SyQv7Wsn0WKvBMbyWQpY7DgO-xTuUV916wcD5tsNelYZdjJYOhZoPcgbKXRLbquCEd0jkecj9MBTtOX0QsX4Vs660ALQj5ZzZcBTN9BgOk2AlEWazK_CBCgjhjE5eX1IZ6r4aRMphqUm_2YUlZWqFcv5WMH304p5n-lEuP_I2uFxcrUiYkVJ9IL7GJ13-9gMWtky7c0wXuDdTdyiXNoaFEHmXqSRcjf06PyUi3YBjiT0jnQxxtZ96PLKsuejk2E48HdXpCIPA"
              />
            </div>

            <ScannerClient />
          </section>

          <section className="rounded-3xl border border-sahara-border/40 bg-sahara-surface-low p-8 shadow-ambient">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="font-serif text-3xl">Dermatology AI</h3>
              <span className="rounded-full bg-sahara-tertiary/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sahara-tertiary">
                Visual Analysis
              </span>
            </div>

            <div className="mb-8 aspect-square overflow-hidden rounded-2xl border border-sahara-border bg-white p-2">
              <img
                alt="Skin concern"
                className="h-full w-full rounded-xl object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiN3gY9ME11z_aCcPrMvfUcRG4APfelk7rwt8MwzZ0bE_ReV1hNbjujPijPpmjRBPrMnwIKRA_c58LvTJps-agupFi87XJwBXQSolcOtRL4PLkNRjd9JePQIURlSuMbQzmyD5ie_iIiIuBn8_psxX1ELiM22m4WBEWXQFX7nnrBq3Q4NyQFySV0oss-iATG8BT7n-aocThAZezkli4xTiMoLmliqXui-zxcCJleGF3OgLWj_dZweUCkQCqS868RX0enxmyWljWtJo"
              />
            </div>

            <div className="space-y-4">
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => setDermFile(event.target.files?.[0] ?? null)}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => setDermFile(event.target.files?.[0] ?? null)}
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="rounded-xl border border-sahara-border bg-white px-4 py-3 text-sm font-bold text-sahara-fg"
                >
                  Select from Gallery
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="rounded-xl border border-sahara-border bg-white px-4 py-3 text-sm font-bold text-sahara-fg"
                >
                  Take Photo
                </button>
              </div>
              <button
                type="button"
                disabled={!dermFile || dermLoading}
                onClick={analyzeDermScan}
                className="w-full rounded-xl bg-sahara-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {dermLoading ? "Analyzing..." : "Analyze Dermatology Scan"}
              </button>
              {dermFile ? <p className="text-xs text-sahara-muted">Selected: {dermFile.name}</p> : null}
              <div className="rounded-xl border border-sahara-tertiary/20 bg-[#fce0e0] p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#6e3030]">Primary Category</p>
                <p className="mt-1 font-serif text-2xl text-[#3a2020]">
                  {String(dermResult?.medicationName ?? dermResult?.summary ?? "Awaiting analysis")}
                </p>
              </div>
              <p className="rounded-xl border-l-4 border-sahara-tertiary bg-white p-4 text-sm text-sahara-muted">
                Clinical insight: {String(dermResult?.summary ?? "Upload an image and run Gemini analysis for insights.")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => runAction("dermatology_book_specialist")}
                  className="rounded-xl border border-sahara-primary px-4 py-3 text-sm font-bold text-sahara-primary"
                >
                  Book Specialist
                </button>
                <button
                  type="button"
                  onClick={() => runAction("dermatology_save_report")}
                  className="rounded-xl bg-sahara-fg px-4 py-3 text-sm font-bold text-white"
                >
                  Save Report
                </button>
              </div>
              {feedback ? <p className="text-sm text-sahara-muted">{feedback}</p> : null}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

