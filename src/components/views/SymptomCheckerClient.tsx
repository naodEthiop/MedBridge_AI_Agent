"use client";

import { useState } from "react";
import { Bot, Mic, PlusCircle, Send } from "lucide-react";

import { triageSymptom } from "@/lib/apiClient";

export function SymptomCheckerClient(props: {
  onResultChange?: (result: Record<string, unknown> | null) => void;
  bodyPart?: string | null;
}) {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ tool: "symptom_checker", input: { message, bodyPart: props.bodyPart ?? null } }),
    });
    const dataText = await res.text();
    setLoading(false);
    if (!res.ok) {
      setError(dataText);
      props.onResultChange?.(null);
      return;
    }
    const parsed = JSON.parse(dataText) as Record<string, unknown>;
    const resultObj = (parsed.result as Record<string, unknown>) ?? parsed;
    setResult(resultObj);
    props.onResultChange?.(resultObj);
  }

  return (
    <div className="flex h-full flex-col gap-8">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sahara-primary/20 text-sahara-primary">
            <Bot className="size-5" />
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-tl-none border border-stone-100 bg-white p-6 shadow-ambient">
            <p className="leading-relaxed text-sahara-fg">
              Hello. I am your MedBridge assistant. Could you confirm if the pain is localized in the lower right area
              of your abdomen?
            </p>
            <p className="mt-4 leading-relaxed text-sahara-fg">
              It also helps to know if the pain feels sharp or dull and whether it moved since it started.
            </p>
          </div>
        </div>

        <div className="flex justify-center py-6">
          <div className="flex h-[500px] w-80 flex-col items-center rounded-3xl border border-stone-100 bg-white p-8 shadow-sm">
            <h3 className="mb-6 font-serif text-lg italic text-stone-500">Symptom Localization</h3>
            <div className="relative w-full flex-1">
              <img
                alt="Anatomy Diagram"
                className="h-full w-full object-contain opacity-80 mix-blend-multiply"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBa65wu9xEZbPeCIguuzlPfckJBQbAon6PL-y7wAa-rQOYjyxFBEYifLRssx4TU0Elvk-JoJ_X3Mb62goYa3ZmYt08YWejzFlRwjlrITlkgU11ovrSUwZpz47pucA7fLZOk7Udw-j1OKt3cZoDIIW2tMkIMDGKXxWPAjhYi3ck4gYwWRAok_PKdYkiIjvQ50En08EwyJLr8WzlK1eZxjOWlDPZjm2Y0a4s4Rt2BlIfMegH8RO-BAqLkmjdT8uahfgikP9ckDeOdboo"
              />
              <div className="absolute bottom-1/4 right-1/4 size-12 animate-pulse rounded-full bg-sahara-primary/30 shadow-[0_0_12px_rgba(194,101,42,0.6)]" />
              <div className="absolute bottom-1/4 right-1/4 size-4 rounded-full bg-sahara-primary" />
            </div>
            <span className="mt-4 text-center text-xs font-semibold uppercase tracking-widest text-sahara-primary">
              Area Identified: Lower Right Quadrant
            </span>
          </div>
        </div>

        <div className="mb-8 flex items-end justify-end gap-4">
          <div className="max-w-[80%] rounded-2xl rounded-tr-none bg-sahara-primary p-6 text-white shadow-md">
            Yes, it is there. It started as a dull ache around my belly button, then moved and feels sharper when I
            move.
          </div>
          <div className="size-10 shrink-0 overflow-hidden rounded-full border-2 border-white bg-stone-200">
            <img
              alt="User profile"
              className="h-full w-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAxAjij5FIu3ubIaOlW8nliD3WAm2AV-5G77uJE7Ry-RVcnwqfl6W-eSamNm7lWFKLiqKvBtXzFAWTCzlN6f4xA9w3QHlfG4p-K_E4DlL8JN-VgbahkXenSrxELVdOtIeH4lHa60I_-Vuzu6j5QU9ONyKiYaMOOd7FPRnaanf5qQw-VcRarq6v3alwii31B3LOBuB5EDapC8CX2fcVFblD7GmpvQqvJtfGXnV-VVp9Se8DjupIBsVQYNk4OdZOSkX_yTxnQufVb7-s"
            />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-sahara-bg/80 pb-2 pt-4 backdrop-blur-md">
        <form onSubmit={onSubmit} className="mx-auto w-full max-w-4xl">
          <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
            <button type="button" className="p-2 text-stone-400 transition-colors hover:text-sahara-primary">
              <PlusCircle className="size-5" />
            </button>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 border-none bg-transparent px-2 py-3 text-sm outline-none"
              placeholder="Type your symptoms here..."
              type="text"
            />
            <button type="button" className="p-2 text-stone-400 transition-colors hover:text-sahara-primary">
              <Mic className="size-5" />
            </button>
            <button
              disabled={loading}
              className="rounded-xl bg-sahara-primary px-4 py-2 text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <Send className="size-5" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] italic text-stone-400">
            MedBridge AI provides guidance and does not replace professional medical advice.
          </p>
        </form>
      </div>

      {error ? (
        <div className="mx-auto w-full max-w-4xl rounded-xl border border-red-300/40 bg-red-100/30 p-3 text-sm text-red-900">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mx-auto w-full max-w-4xl space-y-2 rounded-2xl border border-sahara-border/60 bg-sahara-surface-low p-5">
          <p className="font-semibold">Urgency: {String(result.urgency ?? "unknown")}</p>
          <p className="text-sm text-sahara-muted">{String(result.message ?? "")}</p>
          {Array.isArray(result.redFlags) && result.redFlags.length ? (
            <p className="text-sm">
              <span className="font-semibold">Red flags:</span> {result.redFlags.join(", ")}
            </p>
          ) : null}
          {result.nearestHospital && typeof result.nearestHospital === "object" ? (
            <p className="text-sm">
              <span className="font-semibold">Nearest hospital:</span>{" "}
              {(result.nearestHospital as { name?: string }).name ?? "Unknown"} (
              {(result.nearestHospital as { distanceKm?: number }).distanceKm ?? "?"} km)
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

