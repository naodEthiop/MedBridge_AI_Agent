"use client";

import { useQuery } from "@tanstack/react-query";

import { listDoctors } from "@/lib/apiClient";

export function useDoctors() {
  return useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const res = await listDoctors();
      if (!res.ok) throw new Error(res.error);
      return res.data.doctors;
    },
  });
}

