"use client";

import { useQuery } from "@tanstack/react-query";

import { getNearbyHospitals } from "@/lib/apiClient";

export function useNearbyCare(location: { lat: number; lng: number } | null) {
  return useQuery({
    queryKey: ["nearby-care", location?.lat, location?.lng],
    enabled: !!location,
    queryFn: async () => {
      const res = await getNearbyHospitals({ latitude: location!.lat, longitude: location!.lng });
      if (!res.ok) throw new Error(res.error);
      return res.data as {
        tool: "get_nearby_hospitals";
        result: { places: Array<Record<string, unknown>>; location: { lat: number; lng: number } };
      };
    },
  });
}

