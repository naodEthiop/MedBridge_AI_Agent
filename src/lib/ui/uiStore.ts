"use client";

import { useSyncExternalStore } from "react";

import { extractEventTimestampMs, shouldApplyByMonotonicClock } from "@/lib/ui/uiConsistency";

export type UiChatMessage = {
  id: string;
  role: "doctor" | "assistant" | "system";
  content: string;
  ts: number;
  status: "pending" | "confirmed";
};

export type UiAlert = { id: string; text: string; ts: number; severity: "critical" | "warn" | "info" };

export type UiConnection = "idle" | "connecting" | "live" | "reconnecting" | "unavailable";

export type UiStoreSnapshot = {
  connection: UiConnection;
  lastMonotonicEventMs: number | null;
  recentEvents: { name: string; ts: number }[];
  ai: {
    streaming: boolean;
    lastAnalysisByPatient: Record<string, Record<string, unknown>>;
    lastForecastAt: number | null;
    lastSimulationAt: number | null;
  };
  doctorDashboard: {
    alerts: UiAlert[];
    riskTrajectory: string | null;
    riskUpdatedAt: number | null;
  };
  labs: { pendingCount: number | null; lastResultAt: number | null };
  chatByThread: Record<string, UiChatMessage[]>;
};

const MAX_RECENT = 40;
const MAX_ALERTS = 25;

const defaultState: UiStoreSnapshot = {
  connection: "idle",
  lastMonotonicEventMs: null,
  recentEvents: [],
  ai: {
    streaming: false,
    lastAnalysisByPatient: {},
    lastForecastAt: null,
    lastSimulationAt: null,
  },
  doctorDashboard: {
    alerts: [],
    riskTrajectory: null,
    riskUpdatedAt: null,
  },
  labs: { pendingCount: null, lastResultAt: null },
  chatByThread: {},
};

let snapshot: UiStoreSnapshot = { ...defaultState, recentEvents: [], doctorDashboard: { ...defaultState.doctorDashboard, alerts: [] }, ai: { ...defaultState.ai, lastAnalysisByPatient: {} }, labs: { ...defaultState.labs }, chatByThread: {} };

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function pushRecent(name: string, ts: number) {
  const next = [{ name, ts }, ...snapshot.recentEvents].slice(0, MAX_RECENT);
  snapshot = { ...snapshot, recentEvents: next };
}

function pushAlert(alert: UiAlert) {
  const alerts = [alert, ...snapshot.doctorDashboard.alerts].slice(0, MAX_ALERTS);
  snapshot = {
    ...snapshot,
    doctorDashboard: { ...snapshot.doctorDashboard, alerts },
  };
}

export function subscribeUiStore(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getUiStoreSnapshot(): UiStoreSnapshot {
  return snapshot;
}

export function setUiConnection(status: UiConnection) {
  snapshot = { ...snapshot, connection: status };
  emit();
}

export function setAiStreaming(active: boolean) {
  snapshot = { ...snapshot, ai: { ...snapshot.ai, streaming: active } };
  emit();
}

export function appendChatOptimistic(threadId: string, message: UiChatMessage) {
  const prev = snapshot.chatByThread[threadId] ?? [];
  snapshot = {
    ...snapshot,
    chatByThread: { ...snapshot.chatByThread, [threadId]: [...prev, message] },
  };
  emit();
}

export function confirmAssistantMessage(threadId: string, clientMessageId: string, content: string) {
  const prev = snapshot.chatByThread[threadId] ?? [];
  const next = prev.map((m) =>
    m.id === clientMessageId && m.role === "assistant" && m.status === "pending"
      ? { ...m, content, status: "confirmed" as const }
      : m,
  );
  snapshot = {
    ...snapshot,
    chatByThread: { ...snapshot.chatByThread, [threadId]: next },
  };
  emit();
}

export function mergeChatFromServer(threadId: string, messages: UiChatMessage[]) {
  const merged = mergeByTimestamp(snapshot.chatByThread[threadId] ?? [], messages);
  snapshot = {
    ...snapshot,
    chatByThread: { ...snapshot.chatByThread, [threadId]: merged },
  };
  emit();
}

function mergeChatFromServerSilent(threadId: string, messages: UiChatMessage[]) {
  const merged = mergeByTimestamp(snapshot.chatByThread[threadId] ?? [], messages);
  snapshot = {
    ...snapshot,
    chatByThread: { ...snapshot.chatByThread, [threadId]: merged },
  };
}

function confirmAssistantMessageSilent(threadId: string, clientMessageId: string, content: string) {
  const prev = snapshot.chatByThread[threadId] ?? [];
  const next = prev.map((m) =>
    m.id === clientMessageId && m.role === "assistant" && m.status === "pending"
      ? { ...m, content, status: "confirmed" as const }
      : m,
  );
  snapshot = {
    ...snapshot,
    chatByThread: { ...snapshot.chatByThread, [threadId]: next },
  };
}

function mergeByTimestamp(local: UiChatMessage[], remote: UiChatMessage[]): UiChatMessage[] {
  const map = new Map<string, UiChatMessage>();
  for (const m of remote) map.set(m.id, m);
  for (const m of local) {
    const existing = map.get(m.id);
    if (!existing || m.ts >= existing.ts) map.set(m.id, m);
  }
  return [...map.values()].sort((a, b) => a.ts - b.ts);
}

export function applyRealtimeEvent(event: string, payload: Record<string, unknown>) {
  if (!shouldApplyByMonotonicClock(snapshot.lastMonotonicEventMs, payload, event)) {
    return;
  }
  const ts = extractEventTimestampMs(payload);
  snapshot = { ...snapshot, lastMonotonicEventMs: ts };
  pushRecent(event, ts);

  switch (event) {
    case "appointment:created":
    case "appointment:updated":
      break;
    case "ai:analysis_completed":
    case "ai:clinical_analysis_completed": {
      const pid = typeof payload.patientId === "string" ? payload.patientId : "_global";
      snapshot = {
        ...snapshot,
        ai: {
          ...snapshot.ai,
          streaming: false,
          lastAnalysisByPatient: { ...snapshot.ai.lastAnalysisByPatient, [pid]: { ...payload, receivedAt: ts } },
        },
      };
      break;
    }
    case "ai:forecast_updated":
      snapshot = { ...snapshot, ai: { ...snapshot.ai, lastForecastAt: ts, streaming: false } };
      break;
    case "ai:simulation_updated":
      snapshot = { ...snapshot, ai: { ...snapshot.ai, lastSimulationAt: ts, streaming: false } };
      break;
    case "ai:risk_trajectory_updated": {
      const text =
        typeof payload.summary === "string"
          ? payload.summary
          : typeof payload.message === "string"
            ? payload.message
            : JSON.stringify(payload).slice(0, 280);
      snapshot = {
        ...snapshot,
        doctorDashboard: {
          ...snapshot.doctorDashboard,
          riskTrajectory: text,
          riskUpdatedAt: ts,
        },
      };
      break;
    }
    case "ai:critical_alert":
    case "patient:risk_updated":
    case "ai:early_warning":
    case "ai:early_warning_escalation": {
      const text =
        typeof payload.message === "string"
          ? payload.message
          : typeof payload.summary === "string"
            ? payload.summary
            : `Risk signal: ${event}`;
      pushAlert({
        id: `${event}-${ts}-${Math.random().toString(36).slice(2, 8)}`,
        text,
        ts,
        severity: event === "ai:critical_alert" || payload.riskLevel === "critical" ? "critical" : "warn",
      });
      break;
    }
    case "lab:result_received":
    case "lab:result_updated":
      snapshot = {
        ...snapshot,
        labs: {
          pendingCount:
            typeof payload.pendingCount === "number"
              ? payload.pendingCount
              : snapshot.labs.pendingCount != null
                ? Math.max(0, snapshot.labs.pendingCount - 1)
                : null,
          lastResultAt: ts,
        },
      };
      break;
    case "chat:message_created":
    case "message:created": {
      const threadId = typeof payload.threadId === "string" ? payload.threadId : "default";
      const content = typeof payload.content === "string" ? payload.content : "";
      const clientMid = typeof payload.clientMessageId === "string" ? payload.clientMessageId : null;
      if (clientMid) {
        confirmAssistantMessageSilent(threadId, clientMid, content);
      } else {
        const id = typeof payload.id === "string" ? payload.id : crypto.randomUUID();
        const role = payload.role === "assistant" || payload.role === "doctor" ? payload.role : "assistant";
        const msg: UiChatMessage = {
          id,
          role,
          content,
          ts,
          status: "confirmed",
        };
        mergeChatFromServerSilent(threadId, [msg]);
      }
      break;
    }
    default:
      break;
  }

  emit();
}

export function useUiStore<T>(selector: (s: UiStoreSnapshot) => T): T {
  return useSyncExternalStore(
    subscribeUiStore,
    () => selector(getUiStoreSnapshot()),
    () => selector(getUiStoreSnapshot()),
  );
}
