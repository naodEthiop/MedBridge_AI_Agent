"use client";

import { useQuery } from "@tanstack/react-query";

import { getPatient } from "@/lib/apiClient";

export function usePatient(id: string) {
  return useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const res = await getPatient(id);
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    enabled: !!id,
  });
}

