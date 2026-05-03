"use client";

import type { QueryClient } from "@tanstack/react-query";

type EventName = "appointment:created" | "ai:analysis_completed" | "doctor:note_added" | "patient:risk_updated";

const QUERY_GROUPS: Record<EventName, string[][]> = {
  "appointment:created": [["appointments"], ["doctor-summary"], ["patient-dashboard"]],
  "ai:analysis_completed": [["ai-results"], ["patient-summary"]],
  "doctor:note_added": [["patient-record"], ["doctor-dashboard"]],
  "patient:risk_updated": [["appointments"], ["patient-summary"]],
};

export function invalidateQueryGroup(queryClient: QueryClient, eventType: EventName) {
  const keys = QUERY_GROUPS[eventType] ?? [];
  for (const queryKey of keys) {
    void queryClient.invalidateQueries({ queryKey });
  }
}
