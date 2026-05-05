"use client";

import { useCallback, useRef, useState } from "react";

import type { GeoPlace, PlacesApiResponse } from "@/lib/geoapify/types";

export type PlacesErrorKind = "api_failure" | "network" | "unknown";

export function usePlaces() {
  const [data, setData] = useState<GeoPlace[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorKind, setErrorKind] = useState<PlacesErrorKind | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const lastKeyRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPlaces = useCallback(async (args: { lat: number; lon: number }) => {
    const key = `${args.lat.toFixed(5)},${args.lon.toFixed(5)}`;
    if (lastKeyRef.current === key && data) return;
    lastKeyRef.current = key;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setErrorKind(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/nearby?lat=${encodeURIComponent(args.lat)}&lng=${encodeURIComponent(args.lon)}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorKind("api_failure");
        setErrorMessage(json.error || "Service temporarily unavailable");
        setData([]);
        return;
      }
      // Map backend fields to frontend GeoPlace type
      const mapped = (json.data || []).map((d: any) => ({
        id: d.id,
        name: d.full_name || d.name,
        address: d.specialization || d.address,
        lat: Number(d.lat),
        lon: Number(d.lng),
        kind: "hospital",
        distanceMeters: d.distance ? d.distance * 1000 : null
      }));
      setData(mapped);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setErrorKind("network");
      setErrorMessage("Check your internet connection");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [data]);

  return { data, loading, errorKind, errorMessage, fetchPlaces };
}

