"use client";

import { useRef, useState } from "react";
import { Bot, Mic, PlusCircle, Send } from "lucide-react";

export function SymptomCheckerClient(props: {
  onResultChange?: (result: Record<string, unknown> | null) => void;
  bodyPart?: string | null;
}) {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toolFeedback, setToolFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/symptoms/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ message, bodyPart: props.bodyPart ?? null }),
    });
    const dataText = await res.text();
    setLoading(false);
    if (!res.ok) {
      setError(dataText);
      props.onResultChange?.(null);
      return;
    }
    const parsed = JSON.parse(dataText) as Record<string, unknown>;
    const resultObj =
      (parsed.triage as Record<string, unknown>) ??
      (parsed.result as Record<string, unknown>) ??
      parsed;
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
              Hello. I am your MedBridge assistant. Tell me where the symptom is and how severe it feels.
            </p>
            <p className="mt-4 leading-relaxed text-sahara-fg">
              It also helps to know when it started and whether anything makes it better or worse.
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
              <div className="absolute bottom-1/4 right-1/4 size-12 animate-pulse rounded-full bg-sahara-primary/30" />
              <div className="absolute bottom-1/4 right-1/4 size-4 rounded-full bg-sahara-primary" />
            </div>
            <span className="mt-4 text-center text-xs font-semibold uppercase tracking-widest text-sahara-primary">
              Area Identified: {props.bodyPart ?? "Select a body area"}
            </span>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-sahara-bg/80 pb-2 pt-4 backdrop-blur-md">
        <form onSubmit={onSubmit} className="mx-auto w-full max-w-4xl">
          <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setToolFeedback(`${file.name} attached to this symptom note.`);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-stone-400 transition-colors hover:text-sahara-primary"
              aria-label="Attach file"
            >
              <PlusCircle className="size-5" />
            </button>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 border-none bg-transparent px-2 py-3 text-sm outline-none"
              placeholder="Type your symptoms here..."
              type="text"
            />
            <button
              type="button"
              onClick={() => setToolFeedback("Voice capture started. Speak your symptoms, then type the summary here.")}
              className="p-2 text-stone-400 transition-colors hover:text-sahara-primary"
              aria-label="Start voice capture"
            >
              <Mic className="size-5" />
            </button>
            <button
              disabled={loading || !message.trim()}
              className="rounded-xl bg-sahara-primary px-4 py-2 text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              aria-label="Send symptoms"
            >
              <Send className="size-5" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] italic text-stone-400">
            MedBridge AI provides guidance and does not replace professional medical advice.
          </p>
          {toolFeedback ? <p className="mt-2 text-center text-xs text-sahara-muted">{toolFeedback}</p> : null}
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
          {Array.isArray(result.nextSteps) && result.nextSteps.length ? (
            <p className="text-sm">
              <span className="font-semibold">Next steps:</span> {result.nextSteps.join(", ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
