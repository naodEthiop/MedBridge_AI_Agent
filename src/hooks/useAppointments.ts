"use client";

import { useQuery } from "@tanstack/react-query";

import { listAppointments } from "@/lib/apiClient";

export function useAppointments() {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const res = await listAppointments();
      if (!res.ok) throw new Error(res.error);
      return res.data.appointments;
    },
  });
}
