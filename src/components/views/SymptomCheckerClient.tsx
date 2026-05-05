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
      text: "Hello! I am the MedBridge Doctor AI. I'm here to listen to your symptoms and provide clinical guidance. How are you feeling today?",
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toolFeedback, setToolFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const { containerRef } = useChatScroll(chatHistory);

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const userMessage = message.trim();
    if (!userMessage || loading) return;

    const newHistory = [...chatHistory, { role: "user" as const, text: userMessage }];
    setChatHistory(newHistory);
    setMessage("");
    setLoading(true);
    setError(null);
    
    try {
      // Send last 5 messages for context
      const historyToSend = newHistory.slice(-6).map(m => ({ role: m.role, text: m.text }));

      const res = await fetch("/api/symptoms/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ 
          message: userMessage, 
          bodyPart: props.bodyPart ?? null,
          history: historyToSend 
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok || data.error) {
        const errMsg = "MedBridge AI is not available right now. Please try again later.";
        setError(errMsg);
        setChatHistory(prev => [...prev, { role: "ai", text: errMsg, data: { isError: true } }]);
        return;
      }

      const resultObj = data.message;
      const aiText = resultObj?.message || "MedBridge AI is not available right now. Please try again later.";
      
      setChatHistory((prev) => [...prev, { role: "ai", text: aiText, data: resultObj }]);
      props.onResultChange?.(resultObj ?? null);
    } catch (err) {
      const errMsg = "MedBridge AI is not available right now. Please try again later.";
      setError(errMsg);
      setChatHistory(prev => [...prev, { role: "ai", text: errMsg, data: { isError: true } }]);
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
      setToolFeedback("Voice input is not supported in this browser.");
      return;
    }
    try {
      recognitionRef.current?.stop();
    } catch { /* ignore */ }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript?.trim();
      if (text) setMessage((prev) => (prev ? `${prev} ${text}` : text));
      setToolFeedback(null);
    };
    rec.onerror = () => setToolFeedback("Voice capture stopped.");
    rec.onend = () => { recognitionRef.current = null; };
    recognitionRef.current = rec;
    setToolFeedback("Listening…");
    rec.start();
  }

  return (
    <div className="flex flex-col h-[700px] max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-sahara-border/20">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 space-y-8 bg-sahara-bg/5 scroll-smooth"
      >
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex gap-4 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-2xl shadow-md ${
                msg.role === "user" ? "bg-sahara-primary text-white" : "bg-white text-sahara-primary border border-sahara-border/40"
              }`}>
                {msg.role === "ai" ? <Bot className="size-6" /> : <PlusCircle className="size-6" />}
              </div>
              
              <div className="space-y-2">
                <div className={`relative px-5 py-4 rounded-3xl shadow-sm text-sm leading-relaxed ${
                  msg.role === "user" 
                    ? "bg-sahara-primary text-white rounded-tr-none" 
                    : msg.data?.isError
                      ? "bg-red-50 border border-red-200 text-red-900 rounded-tl-none"
                      : "bg-white border border-sahara-border/20 text-sahara-fg rounded-tl-none"
                }`}>
                  <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                </div>

                {msg.role === "ai" && msg.data && !msg.data.isError && (
                  <div className="flex flex-col gap-3 ml-1">
                    {(msg.data.riskLevel === 'medium' || msg.data.riskLevel === 'high') && (
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          msg.data.riskLevel === 'high' 
                            ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse' 
                            : 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                        }`}>
                          ⚠️ Risk: {msg.data.riskLevel}
                        </span>
                      </div>
                    )}

                    {Array.isArray(msg.data.advice) && msg.data.advice.length > 0 && (
                      <div className="rounded-2xl bg-sahara-primary/5 border border-sahara-primary/10 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sahara-primary">
                          <span className="text-lg">💡</span>
                          <span className="text-[11px] font-bold uppercase tracking-widest">Recommended Advice</span>
                        </div>
                        <ul className="space-y-1.5">
                          {msg.data.advice.map((item: string, i: number) => (
                            <li key={i} className="flex gap-2 text-xs text-sahara-fg/80">
                              <span className="text-sahara-primary/60">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {Array.isArray(msg.data.followUp) && msg.data.followUp.length > 0 && (
                      <div className="rounded-2xl bg-white border border-sahara-border/40 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sahara-muted">
                          <span className="text-lg">❓</span>
                          <span className="text-[11px] font-bold uppercase tracking-widest">Follow-up Questions</span>
                        </div>
                        <ul className="space-y-1.5">
                          {msg.data.followUp.map((q: string, i: number) => (
                            <li key={i} className="flex gap-2 text-xs text-sahara-fg/80">
                              <span className="text-sahara-muted/40">?</span>
                              <span>{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white border border-sahara-border/40 text-sahara-primary">
                <Bot className="size-5" />
              </div>
              <div className="bg-white border border-sahara-border/20 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-sahara-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-sahara-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-sahara-primary/80 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-sahara-border/20">
        <form 
          onSubmit={onSubmit} 
          className="flex gap-2 items-center bg-sahara-bg/5 rounded-full p-1.5 border border-sahara-border/10 focus-within:border-sahara-primary/40 focus-within:ring-4 focus-within:ring-sahara-primary/5 transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setToolFeedback(`Attached: ${file.name}`);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-sahara-muted hover:text-sahara-primary transition-colors"
            title="Attach image"
          >
            <PlusCircle className="size-6" />
          </button>
          
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-sm placeholder:text-sahara-muted"
            placeholder="Type your symptoms here..."
          />

          <button
            type="button"
            onClick={startVoice}
            className="p-2 text-sahara-muted hover:text-sahara-primary transition-colors"
          >
            <Mic className="size-5" />
          </button>

          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="bg-sahara-primary text-white p-2.5 rounded-full hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none transition-all"
          >
            <Send className="size-5" />
          </button>
        </form>
        {toolFeedback && <p className="mt-2 text-center text-[10px] text-sahara-primary font-medium">{toolFeedback}</p>}
        <p className="mt-3 text-center text-[10px] text-sahara-muted italic">
          MedBridge AI provides guidance and does not replace professional medical advice.
        </p>
      </div>
    </div>
  );
}
