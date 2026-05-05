import { emitEvent } from "@/lib/server/events";

export type HealthSignal = "ok" | "fail";

export type SystemHealthSnapshot = {
  auth: HealthSignal;
  mcp: HealthSignal;
  openai: HealthSignal;
  edge: HealthSignal;
};

/**
 * Unified production health log + realtime event (no silent degradation).
 */
export function logSystemHealth(status: SystemHealthSnapshot): void {
  console.info("[system:health]", JSON.stringify(status));
  emitEvent("system:health_check", {
    auth: status.auth,
    mcp: status.mcp,
    openai: status.openai,
    edge: status.edge,
    timestamp: new Date().toISOString(),
  });
}
