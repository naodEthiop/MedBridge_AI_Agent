"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { listAppointments } from "@/lib/apiClient";
import { useRealtime } from "@/hooks/useRealtime";

export function useAppointments() {
  const queryClient = useQueryClient();

  useRealtime(
    "realtime:global",
    {
      "appointment:created": () => void queryClient.invalidateQueries({ queryKey: ["appointments"] }),
      "patient:risk_updated": () => void queryClient.invalidateQueries({ queryKey: ["appointments"] }),
    },
    () => void queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  );

  return useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const res = await listAppointments();
      if (!res.ok) throw new Error(res.error);
      return res.data.appointments;
    },
  });
}
