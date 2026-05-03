"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";

type ChatMessage = {
  role: "assistant" | "doctor";
  content: string;
};

type MedixPayload = {
  message: string;
  urgency: "low" | "medium" | "urgent";
  possibleConditions: string[];
  nextSteps: string[];
  redFlags: string[];
};

export function DoctorAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello, I'm your clinical assistant. How can I support today's patient?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages((current) => [...current, { role: "doctor", content: trimmed }]);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/ai/process", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ message: trimmed, skipTriage: true }),
    });
    const data = res.ok
      ? ((await res.json()) as { ok?: boolean; medix?: MedixPayload; error?: string })
      : null;
    const medix = data?.ok !== false ? data?.medix : undefined;
    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        content: medix
          ? [medix.message, ...(medix.nextSteps ?? [])].filter(Boolean).slice(0, 2).join(" ")
          : data?.error ?? "I could not reach the assistant endpoint. Please try again.",
      },
    ]);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="font-serif text-2xl">Doctor AI Assistant</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 rounded-3xl border border-sahara-border/60 bg-sahara-surface-low p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "doctor"
                    ? "rounded-2xl bg-sahara-primary/10 p-4 text-sahara-fg"
                    : "rounded-2xl bg-white p-4 text-sahara-fg"
                }
              >
                <p className="text-xs uppercase tracking-widest text-sahara-muted">
                  {message.role === "doctor" ? "Doctor" : "Assistant"}
                </p>
                <p className="mt-2 text-sm leading-6">{message.content}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type a message to the assistant..."
              rows={4}
              className="w-full rounded-2xl border border-sahara-border/70 bg-white p-3 text-sm outline-none focus:border-sahara-primary"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="rounded-2xl bg-sahara-primary px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
