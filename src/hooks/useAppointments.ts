"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { invalidateQueryGroup } from "@/hooks/invalidateQueryGroup";
import { useRealtime } from "@/hooks/useRealtime";
import { listAppointments } from "@/lib/apiClient";

export function useAppointments() {
  const queryClient = useQueryClient();

  useRealtime("realtime:global", {
    "appointment:created": () => invalidateQueryGroup(queryClient, "appointment:created"),
    "patient:risk_updated": () => invalidateQueryGroup(queryClient, "patient:risk_updated"),
  });

  return useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const res = await listAppointments();
      if (!res.ok) throw new Error(res.error);
      return res.data.appointments;
    },
  });
}
