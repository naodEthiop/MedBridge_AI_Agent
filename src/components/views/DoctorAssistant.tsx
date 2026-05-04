"use client";

import { useCallback, useLayoutEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import {
  appendChatOptimistic,
  confirmAssistantMessage,
  getUiStoreSnapshot,
  setAiStreaming,
  type UiChatMessage,
  useUiStore,
} from "@/lib/ui/uiStore";

const WELCOME =
  "Hello, I'm your clinical assistant. How can I support today's patient?";

function unwrapPayload(data: Record<string, unknown>): Record<string, unknown> {
  const inner = data.result ?? data.payload ?? data.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) return inner as Record<string, unknown>;
  return data;
}

function formatAgentPayload(data: Record<string, unknown>): string {
  const d = unwrapPayload(data);
  if (typeof d.error === "string") return d.error;
  if (d.stage === "follow_up") {
    return [d.question, d.guidance].filter((x) => typeof x === "string" && (x as string).trim()).join("\n\n");
  }
  const parts: string[] = [];
  if (typeof d.summary === "string" && d.summary.trim()) parts.push(d.summary);
  if (typeof d.recommendation === "string" && d.recommendation.trim()) parts.push(d.recommendation);
  if (typeof d.question === "string" && d.question.trim()) parts.push(d.question);
  if (typeof d.message === "string" && d.message.trim()) parts.push(d.message);
  if (Array.isArray(d.emergencySteps) && d.emergencySteps.length) {
    parts.push("Emergency steps:\n" + (d.emergencySteps as string[]).join("\n"));
  }
  if (d.nearbyHospitals && typeof d.nearbyHospitals === "object") {
    parts.push("Nearby resources returned — review the clinical dashboard for details.");
  }
  const joined = parts.join("\n\n").trim();
  return joined || JSON.stringify(d, null, 2);
}

const EMPTY_THREAD: UiChatMessage[] = [];

export function DoctorAssistant(props: { threadId?: string }) {
  const threadId = props.threadId ?? "doctor-assistant";
  const messages = useUiStore(useCallback((s) => s.chatByThread[threadId] ?? EMPTY_THREAD, [threadId]));
  const streaming = useUiStore(useCallback((s) => s.ai.streaming, []));

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useLayoutEffect(() => {
    const cur = getUiStoreSnapshot().chatByThread[threadId];
    if (!cur?.length) {
      appendChatOptimistic(threadId, {
        id: "welcome-assistant",
        role: "assistant",
        content: WELCOME,
        ts: Date.now() - 1,
        status: "confirmed",
      });
    }
  }, [threadId]);

  const sorted = useMemo(() => [...messages].sort((a, b) => a.ts - b.ts), [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const doctorId = crypto.randomUUID();
    const assistantId = crypto.randomUUID();
    const now = Date.now();

    appendChatOptimistic(threadId, {
      id: doctorId,
      role: "doctor",
      content: trimmed,
      ts: now,
      status: "confirmed",
    });
    appendChatOptimistic(threadId, {
      id: assistantId,
      role: "assistant",
      content: "…",
      ts: now + 1,
      status: "pending",
    });
    setInput("");
    setSending(true);
    setAiStreaming(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          symptom: trimmed,
          followUpAnswer: "Doctor requested clinical support.",
          clientMessageId: assistantId,
          threadId,
        }),
      });
      const text = await res.text();
      let data: Record<string, unknown> | null = null;
      try {
        const parsed = JSON.parse(text) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) data = parsed as Record<string, unknown>;
      } catch {
        if (res.ok && text.trim()) data = { message: text.trim() };
      }
      const content =
        res.ok && data
          ? formatAgentPayload(data)
          : "I could not reach the assistant endpoint. Please try again.";
      confirmAssistantMessage(threadId, assistantId, content);
    } catch {
      confirmAssistantMessage(
        threadId,
        assistantId,
        "Something went wrong while contacting the assistant. Please retry.",
      );
    } finally {
      setSending(false);
      setAiStreaming(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="font-serif text-2xl">Doctor AI Assistant</h3>
          <p className="text-xs text-sahara-muted">Event-synced thread · realtime:global</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-3xl border border-sahara-border/60 bg-sahara-surface-low p-4">
            {sorted.map((message: UiChatMessage) => (
              <div
                key={message.id}
                className={
                  message.role === "doctor"
                    ? "rounded-2xl bg-sahara-primary/10 p-4 text-sahara-fg"
                    : "rounded-2xl bg-white p-4 text-sahara-fg"
                }
              >
                <p className="text-xs uppercase tracking-widest text-sahara-muted">
                  {message.role === "doctor" ? "Doctor" : "Assistant"}
                  {message.status === "pending" ? " · syncing" : ""}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
              </div>
            ))}
            {sending || streaming ? (
              <p className="text-center text-xs text-sahara-muted" aria-live="polite">
                Assistant pipeline active…
              </p>
            ) : null}
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
              onClick={() => void handleSend()}
              disabled={sending || !input.trim()}
              className="rounded-2xl bg-sahara-primary px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
