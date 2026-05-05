"use client";

import { useQuery } from "@tanstack/react-query";
import { safeFetch } from "@/lib/safeFetch";

export function useNearbyDoctors(location: { lat: number; lng: number } | null) {
  return useQuery({
    queryKey: ["nearby-doctors", location?.lat, location?.lng],
    enabled: !!location,
    queryFn: async () => {
      const res = await safeFetch<{ success: boolean; data: any[] }>(
        `/api/nearby?lat=${location!.lat}&lng=${location!.lng}`
      );
      if (!res.success) throw new Error(res.error);
      
      return (res.data?.data || []).map(d => ({
        id: d.id,
        name: d.full_name || d.name,
        address: d.specialization || d.address,
        lat: Number(d.lat),
        lon: Number(d.lng),
        kind: "doctor",
        distanceMeters: d.distance ? d.distance * 1000 : null
      }));
    },
  });
}
