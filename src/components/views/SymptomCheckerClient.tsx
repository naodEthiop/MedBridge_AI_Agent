"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Bot, Mic, PlusCircle, Send } from "lucide-react";

/** Narrow Web Speech API surface for browsers without TS DOM typings */
type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: Array<Array<{ transcript?: string }>> }) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function SymptomCheckerClient(props: {
  onResultChange?: (result: Record<string, unknown> | null) => void;
  bodyPart?: string | null;
  initialMessage?: string;
}) {
  const [message, setMessage] = useState(props.initialMessage ?? "");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toolFeedback, setToolFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/symptoms/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ message, bodyPart: props.bodyPart ?? null }),
      });
      const dataText = await res.text();
      if (!res.ok) {
        setError(dataText || "Triage request failed.");
        props.onResultChange?.(null);
        return;
      }
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(dataText) as Record<string, unknown>;
      } catch {
        setError("Unexpected response from triage service.");
        props.onResultChange?.(null);
        return;
      }
      const resultObj =
        (parsed.triage as Record<string, unknown>) ??
        (parsed.result as Record<string, unknown>) ??
        (parsed.tool === "symptom_checker" ? (parsed.result as Record<string, unknown>) : parsed);
      setResult(resultObj ?? null);
      props.onResultChange?.(resultObj ?? null);
    } finally {
      setLoading(false);
    }
  }

  function startVoice() {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setToolFeedback("Voice input is not supported in this browser. Type your symptoms or use mobile dictation.");
      return;
    }
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript?.trim();
      if (text) setMessage((prev) => (prev ? `${prev} ${text}` : text));
      setToolFeedback(null);
    };
    rec.onerror = (ev: Event) => {
      const err = (ev as unknown as { error?: string }).error;
      setToolFeedback(
        err === "not-allowed"
          ? "Microphone blocked — allow access in the browser address bar, or type your symptoms."
          : "Voice capture stopped. You can type instead.",
      );
    };
    rec.onend = () => {
      recognitionRef.current = null;
    };
    recognitionRef.current = rec;
    setToolFeedback("Listening… speak your symptoms, then pause.");
    rec.start();
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

        <div className="flex justify-center py-4">
          <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-gradient-to-b from-white to-sahara-surface-low p-8 text-center shadow-sm">
            <h3 className="mb-2 font-serif text-lg italic text-stone-500">Symptom localization</h3>
            <div className="mx-auto mb-4 flex max-w-[200px] justify-center rounded-2xl border border-sahara-border/50 bg-white p-4">
              <svg viewBox="0 0 100 120" className="h-48 w-full text-sahara-muted" aria-hidden>
                <path
                  d="M50 4c-8 0-14 6-14 14v8c0 6 4 11 9 13-6 2-10 8-10 15v42c0 8 6 14 14 14h2c8 0 14-6 14-14V54c0-7-4-13-10-15 5-2 9-7 9-13v-8c0-8-6-14-14-14z"
                  fill="rgb(236 230 220)"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-sahara-border"
                />
                <ellipse cx="50" cy="22" rx="10" ry="11" fill="rgb(252 224 224 / 0.35)" stroke="rgb(194 101 42)" strokeWidth="1.5" />
                <rect x="36" y="36" width="28" height="22" rx="3" fill="rgb(194 101 42 / 0.12)" stroke="rgb(194 101 42)" strokeWidth="1" />
                <rect x="38" y="60" width="24" height="18" rx="3" fill="rgb(194 101 42 / 0.08)" stroke="rgb(194 101 42)" strokeWidth="1" />
                <rect x="22" y="40" width="10" height="28" rx="2" fill="rgb(194 101 42 / 0.08)" stroke="rgb(194 101 42)" strokeWidth="1" />
                <rect x="68" y="40" width="10" height="28" rx="2" fill="rgb(194 101 42 / 0.08)" stroke="rgb(194 101 42)" strokeWidth="1" />
                <rect x="40" y="82" width="8" height="28" rx="2" fill="rgb(194 101 42 / 0.08)" stroke="rgb(194 101 42)" strokeWidth="1" />
                <rect x="52" y="82" width="8" height="28" rx="2" fill="rgb(194 101 42 / 0.08)" stroke="rgb(194 101 42)" strokeWidth="1" />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sahara-primary">
              Focus area: <span className="capitalize">{props.bodyPart ?? "select on the map above"}</span>
            </p>
            <p className="mt-2 text-xs text-sahara-muted">The interactive body selector above drives triage context.</p>
            <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-[11px] leading-relaxed text-stone-500 ring-1 ring-stone-100">
              <span className="font-semibold text-stone-600">Visualization:</span> illustrative 2D figure highlights your
              region. Full interactive 3D anatomy is planned as an upgrade—this preview keeps localization visible today.
            </p>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-sahara-bg/90 pb-2 pt-4 backdrop-blur-md">
        <form onSubmit={onSubmit} className="mx-auto w-full max-w-4xl">
          <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setToolFeedback(`${file.name} attached — describe symptoms in text, then send.`);
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
              onClick={startVoice}
              className="p-2 text-stone-400 transition-colors hover:text-sahara-primary"
              aria-label="Start voice capture"
            >
              <Mic className="size-5" />
            </button>
            <button
              type="submit"
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
          <p className="mt-2 text-center text-[10px] text-stone-400">
            <Link href="/patient" className="font-semibold text-sahara-primary hover:underline">
              Back to dashboard
            </Link>
            {" · "}
            After voice input, review the text field and tap send.
          </p>
        </form>
      </div>

      {loading ? (
        <div className="mx-auto w-full max-w-4xl rounded-xl border border-sahara-border/50 bg-white p-3 text-center text-sm text-sahara-muted">
          Analyzing your symptoms…
        </div>
      ) : null}

      {error ? (
        <div className="mx-auto w-full max-w-4xl rounded-xl border border-red-300/40 bg-red-100/30 p-3 text-sm text-red-900">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mx-auto w-full max-w-4xl space-y-2 rounded-2xl border border-sahara-border/60 bg-sahara-surface-low p-5">
          <p className="font-semibold">Urgency: {String(result.urgency ?? "unknown")}</p>
          <p className="text-sm text-sahara-muted">{String(result.message ?? "")}</p>
          {Array.isArray(result.possibleConditions) && result.possibleConditions.length ? (
            <p className="text-sm">
              <span className="font-semibold">Possible considerations:</span>{" "}
              {(result.possibleConditions as string[]).join(", ")}
            </p>
          ) : null}
          {Array.isArray(result.redFlags) && result.redFlags.length ? (
            <p className="text-sm">
              <span className="font-semibold">Red flags:</span> {(result.redFlags as string[]).join(", ")}
            </p>
          ) : null}
          {Array.isArray(result.nextSteps) && result.nextSteps.length ? (
            <p className="text-sm">
              <span className="font-semibold">Next steps:</span> {(result.nextSteps as string[]).join(", ")}
            </p>
          ) : null}
        </div>
      ) : !loading && !error ? (
        <p className="mx-auto max-w-4xl text-center text-xs text-sahara-muted">Results appear here after you send a symptom message.</p>
      ) : null}
    </div>
  );
}
