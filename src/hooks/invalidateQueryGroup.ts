"use client";

import type { QueryClient } from "@tanstack/react-query";

/** Legacy narrow union — prefer {@link invalidateForRealtimeEvent}. */
export type LegacyEventName = "appointment:created" | "ai:analysis_completed" | "doctor:note_added" | "patient:risk_updated";

const LEGACY_GROUPS: Record<LegacyEventName, string[][]> = {
  "appointment:created": [["appointments"], ["patients"], ["doctors"]],
  "ai:analysis_completed": [["appointments"], ["patients"], ["doctors"], ["ai-results"], ["patient-summary"]],
  "doctor:note_added": [["patients"], ["appointments"], ["doctors"]],
  "patient:risk_updated": [["appointments"], ["patients"], ["doctors"]],
};

/** Broad groups keyed by server / eventBus broadcast names. */
const REALTIME_QUERY_MAP: Record<string, string[][]> = {
  "appointment:created": [["appointments"], ["patients"], ["doctors"]],
  "appointment:updated": [["appointments"], ["patients"], ["doctors"]],
  "ai:analysis_completed": [["appointments"], ["patients"], ["doctors"], ["ai-results"], ["patient-summary"]],
  "ai:clinical_analysis_completed": [["appointments"], ["patients"], ["doctors"], ["ai-results"], ["patient-summary"]],
  "ai:forecast_updated": [["ai-results"], ["patient-summary"], ["patients"]],
  "ai:simulation_updated": [["ai-results"], ["patient-summary"]],
  "ai:risk_trajectory_updated": [["patients"], ["appointments"], ["doctors"], ["ai-results"]],
  "ai:request_completed": [["patients"], ["doctors"], ["ai-results"]],
  "ai:critical_alert": [["patients"], ["doctors"], ["appointments"]],
  "patient:risk_updated": [["patients"], ["appointments"], ["doctors"]],
  "doctor:note_added": [["patients"], ["appointments"], ["doctors"]],
  "lab:result_received": [["appointments"], ["patients"], ["doctors"]],
  "lab:result_updated": [["appointments"], ["patients"], ["doctors"]],
  "ehr:sync_completed": [["patients"], ["appointments"], ["doctors"]],
  "sync:completed": [["patients"], ["appointments"], ["doctors"]],
};

export function invalidateQueryGroup(queryClient: QueryClient, eventType: LegacyEventName) {
  const keys = LEGACY_GROUPS[eventType] ?? [];
  for (const queryKey of keys) {
    void queryClient.invalidateQueries({ queryKey });
  }
}

export function invalidateForRealtimeEvent(queryClient: QueryClient, event: string) {
  const keys = REALTIME_QUERY_MAP[event];
  if (!keys?.length) return;
  for (const queryKey of keys) {
    void queryClient.invalidateQueries({ queryKey });
  }
}
