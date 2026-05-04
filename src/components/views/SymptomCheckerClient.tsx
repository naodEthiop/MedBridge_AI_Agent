"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Bot, ChevronDown, Mic, PlusCircle, Send } from "lucide-react";
import { cleanErrorMessage } from "@/lib/userErrors";
import { useChatScroll } from "@/hooks/useChatScroll";

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
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string; data?: any }[]>([
    {
      role: "ai",
      text: "Hello. I am your MedBridge assistant. Tell me where the symptom is and how severe it feels. It also helps to know when it started and whether anything makes it better or worse.",
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toolFeedback, setToolFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const { containerRef, isUserAtBottom } = useChatScroll(chatHistory);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const userMessage = message.trim();
    if (!userMessage) return;

    setChatHistory((prev) => [...prev, { role: "user", text: userMessage }]);
    setMessage(""); // Add user message immediately and clear input
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/symptoms/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ message: userMessage, bodyPart: props.bodyPart ?? null }),
      });
      const dataText = await res.text();
      if (!res.ok) {
        setError(cleanErrorMessage(dataText || "Unable to analyze symptoms"));
        props.onResultChange?.(null);
        return;
      }
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(dataText) as Record<string, unknown>;
      } catch {
        setError("We couldn't process your response. Please try again.");
        props.onResultChange?.(null);
        return;
      }
      const resultObj =
        (parsed.triage as Record<string, unknown>) ??
        (parsed.result as Record<string, unknown>) ??
        (parsed.tool === "symptom_checker" ? (parsed.result as Record<string, unknown>) : parsed);
      
      const isError = (resultObj as any)?.isError === true;
      const aiText = typeof resultObj?.message === "string" ? resultObj.message : "I'm here to listen. Could you provide a few more details about your symptoms?";
      
      // STEP 5: PREVENT CHAT LOOP
      const lastAiMsg = [...chatHistory].reverse().find(m => m.role === "ai");
      if (isError && lastAiMsg?.text === aiText) {
        setLoading(false);
        return;
      }

      setChatHistory((prev) => [...prev, { role: "ai", text: aiText, data: resultObj }]);
      props.onResultChange?.(resultObj ?? null);
    } catch {
      setError("Failed to process your symptoms. Please try again.");
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
    <div className="flex flex-col gap-4 h-full max-w-4xl mx-auto">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-4 px-4 py-4 scroll-smooth"
      >
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "ai" && (
              <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${msg.data?.isError ? "bg-red-100 text-red-600" : "bg-sahara-primary/20 text-sahara-primary"}`}>
                <Bot className="size-5" />
              </div>
            )}
            <div className={`max-w-xl rounded-2xl px-4 py-3 ${
              msg.role === "user" 
                ? "bg-sahara-primary text-white rounded-br-none shadow-sm" 
                : msg.data?.isError
                  ? "bg-red-50 border border-red-200 text-red-900 rounded-bl-none shadow-sm"
                  : "bg-white/90 backdrop-blur border border-sahara-border/40 rounded-bl-none text-sahara-fg"
            }`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
              {msg.role === "ai" && msg.data && !msg.data.isError && (
                <div className="mt-4 space-y-3 border-t border-stone-100 pt-3">
                  {msg.data.riskLevel && (
                    <p className="text-xs font-semibold">Risk Level: <span className="uppercase text-sahara-primary">{msg.data.riskLevel}</span></p>
                  )}
                  {Array.isArray(msg.data.followUpQuestions) && msg.data.followUpQuestions.length > 0 && (
                    <div className="text-xs">
                      <span className="font-semibold text-stone-600">Follow-up:</span>
                      <ul className="mt-1.5 list-inside list-disc space-y-1 text-stone-500">
                        {msg.data.followUpQuestions.map((q: string, i: number) => <li key={i}>{q}</li>)}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(msg.data.recommendations) && msg.data.recommendations.length > 0 && (
                    <div className="text-xs">
                      <span className="font-semibold text-stone-600">Recommendations:</span>
                      <ul className="mt-1.5 list-inside list-disc space-y-1 text-stone-500">
                        {msg.data.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-3 justify-start items-end">
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

      {!isUserAtBottom && (
        <div className="flex justify-center px-4 pb-2">
          <button
            onClick={() => {
              containerRef.current?.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: "smooth",
              });
            }}
            className="flex items-center gap-2 rounded-full bg-sahara-primary/90 px-4 py-2 text-xs font-semibold text-white shadow-md transition-opacity hover:opacity-90"
            aria-label="Scroll to new messages"
          >
            <span>New messages</span>
            <ChevronDown className="size-4" />
          </button>
        </div>
      )}

      <div className="sticky bottom-0 bg-gradient-to-t from-sahara-bg via-sahara-bg/95 to-transparent px-4 py-4 border-t border-sahara-border/40">
        <form onSubmit={onSubmit} className="flex gap-2">
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
