"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type GlobalBroadcastHandler = (event: string, payload: Record<string, unknown>) => void;

/**
 * Single Supabase Realtime broadcast subscription for `realtime:global`.
 * All UI surfaces consume updates via {@link useAppRealtime} + uiStore — not this module directly.
 */
export function subscribeRealtimeGlobal(onEvent: GlobalBroadcastHandler): () => void {
  let supabase: ReturnType<typeof getSupabaseBrowserClient> | null = null;
  let channel: RealtimeChannel | null = null;
  try {
    supabase = getSupabaseBrowserClient();
    channel = supabase.channel("realtime:global", {
      config: { broadcast: { self: true, ack: false } },
    });

    channel.on("broadcast", { event: "*" }, (msg: { event?: string; payload?: unknown }) => {
      const event = typeof msg.event === "string" ? msg.event : "";
      const raw = msg.payload;
      if (!event || !raw || typeof raw !== "object" || Array.isArray(raw)) return;
      onEvent(event, raw as Record<string, unknown>);
    });

    void channel.subscribe();
    return () => {
      if (channel && supabase) void supabase.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}
