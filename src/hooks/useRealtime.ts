"use client";

import { useEffect, useMemo, useRef } from "react";

import { getSupabaseBrowserClient } from "@/lib/db/supabaseClient";

const supabase = getSupabaseBrowserClient();

type RealtimeHandlers = Record<string, (payload: Record<string, unknown>) => void>;

export function useRealtime(channelName: string, handlers: RealtimeHandlers, onReconnect?: () => void) {
  // Use the singleton supabase
  const handlersRef = useRef(handlers);
  const reconnectRef = useRef(onReconnect);
  const lastProcessedEventTimestampRef = useRef<number>(0);

  useEffect(() => {
    handlersRef.current = handlers;
    reconnectRef.current = onReconnect;
  }, [handlers, onReconnect]);

  useEffect(() => {
    const channel = supabase.channel(channelName, { config: { broadcast: { self: false, ack: false } } });

    channel.on("broadcast", { event: "*" }, ({ event, payload }: { event: string; payload: any }) => {
      const payloadTs =
        payload && typeof payload === "object" && typeof (payload as { timestamp?: unknown }).timestamp === "string"
          ? new Date((payload as { timestamp: string }).timestamp).getTime()
          : Date.now();
      if (payloadTs <= lastProcessedEventTimestampRef.current) return;
      lastProcessedEventTimestampRef.current = payloadTs;

      const callback = handlersRef.current[event];
      if (callback && payload && typeof payload === "object") {
        callback(payload as Record<string, unknown>);
      }
    });

    channel.subscribe((status: string) => {
      if (status === "SUBSCRIBED") {
        reconnectRef.current?.();
      }
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelName, supabase]);
}
