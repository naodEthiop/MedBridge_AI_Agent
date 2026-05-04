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

  type Message = { role: "user" | "assistant"; content: string };
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello. I&apos;m your MedBridge assistant. Tell me where the symptom is and how severe it feels. It also helps to know when it started and whether anything makes it better or worse.",
    },
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMsg: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
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
        return;
      }

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(dataText) as Record<string, unknown>;
      } catch {
        setError("Unexpected response from triage service.");
        return;
      }

      const resultObj =
        (parsed.triage as Record<string, unknown>) ??
        (parsed.result as Record<string, unknown>) ??
        (parsed.tool === "symptom_checker" ? (parsed.result as Record<string, unknown>) : parsed);

      setResult(resultObj ?? null);
      props.onResultChange?.(resultObj ?? null);

      const diagnosis = String(resultObj?.diagnosis ?? "");
      const riskLevel = String(resultObj?.riskLevel ?? "unknown").toUpperCase();
      const recommendations = Array.isArray(resultObj?.recommendations)
        ? (resultObj.recommendations as string[]).join(", ")
        : "";

      const aiResponse = `Risk Level: ${riskLevel}\n\n${diagnosis}${recommendations ? `\n\nRecommendations: ${recommendations}` : ""}`;
      const aiMsg: Message = { role: "assistant", content: aiResponse };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setError("Failed to process your symptoms. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto space-y-4 px-4 py-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sahara-primary/20 text-sahara-primary">
                <Bot className="size-5" />
              </div>
            )}
            <div
              className={`max-w-xl rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-sahara-primary text-white rounded-br-none"
                  : "bg-white/90 backdrop-blur border border-sahara-border/40 rounded-bl-none text-sahara-fg"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sahara-primary/20 text-sahara-primary">
              <Bot className="size-5" />
            </div>
            <div className="bg-white/90 backdrop-blur border border-sahara-border/40 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1">
              <span className="inline-block w-2 h-2 bg-sahara-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="inline-block w-2 h-2 bg-sahara-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="inline-block w-2 h-2 bg-sahara-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {error && (
          <div className="flex gap-3 justify-start">
            <div className="w-full rounded-2xl border border-red-300/50 bg-red-50/80 px-4 py-3 text-sm text-red-900">
              {error}
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-gradient-to-t from-sahara-bg via-sahara-bg/95 to-transparent px-4 py-4 border-t border-sahara-border/40">
        <form onSubmit={handleSubmit} className="flex gap-2">
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
            className="flex items-center justify-center shrink-0 size-10 rounded-full text-stone-400 hover:text-sahara-primary transition-colors hover:bg-white/50"
            aria-label="Attach file"
          >
            <PlusCircle className="size-5" />
          </button>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 rounded-full bg-white/70 backdrop-blur border border-stone-200/80 px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-sahara-primary/30 focus:border-sahara-primary"
            placeholder="Describe your symptoms..."
            type="text"
          />
          <button
            type="button"
            onClick={startVoice}
            className="flex items-center justify-center shrink-0 size-10 rounded-full text-stone-400 hover:text-sahara-primary transition-colors hover:bg-white/50"
            aria-label="Start voice capture"
          >
            <Mic className="size-5" />
          </button>
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="flex items-center justify-center shrink-0 size-10 rounded-full bg-sahara-primary text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            aria-label="Send symptoms"
          >
            <Send className="size-5" />
          </button>
        </form>
        {toolFeedback ? <p className="mt-2 text-center text-xs text-sahara-muted">{toolFeedback}</p> : null}
        <p className="mt-3 text-center text-[10px] italic text-stone-400">
          MedBridge AI provides guidance and does not replace professional medical advice.
        </p>
      </div>
    </div>
  );
}
