"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { invalidateForRealtimeEvent } from "@/hooks/invalidateQueryGroup";
import { subscribeRealtimeGlobal } from "@/lib/realtime/globalChannel";
import { createRingFingerprintSet, fingerprintClientEvent } from "@/lib/ui/uiConsistency";
import { applyRealtimeEvent, setUiConnection } from "@/lib/ui/uiStore";

const dedupe = createRingFingerprintSet(400);

/**
 * One subscription per app: merges realtime into {@link applyRealtimeEvent} and invalidates TanStack Query groups.
 * Mount inside {@link QueryClientProvider} only (see AppRealtimeBridge).
 */
export function useAppRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    setUiConnection("connecting");
    const unsub = subscribeRealtimeGlobal((event, payload) => {
      const fp = fingerprintClientEvent(event, payload);
      if (!dedupe.add(fp)) return;
      applyRealtimeEvent(event, payload);
      invalidateForRealtimeEvent(queryClient, event);
    });
    setUiConnection("live");
    return () => {
      unsub();
      dedupe.clear();
      setUiConnection("idle");
    };
  }, [queryClient]);
}
