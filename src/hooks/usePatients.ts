"use client";

import { useQuery } from "@tanstack/react-query";

import { listPatients } from "@/lib/apiClient";

export function usePatients() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const res = await listPatients();
      if (!res.ok) throw new Error(res.error);
      return res.data.patients;
    },
  });
}

