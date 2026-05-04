"use client";

import { useAppRealtime } from "@/hooks/useAppRealtime";

/** Mount once under QueryClientProvider to wire global Supabase broadcast → uiStore + React Query. */
export function AppRealtimeBridge() {
  useAppRealtime();
  return null;
}
