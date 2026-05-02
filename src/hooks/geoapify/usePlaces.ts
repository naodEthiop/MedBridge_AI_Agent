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
      const res = await fetch(`/api/places?lat=${encodeURIComponent(args.lat)}&lon=${encodeURIComponent(args.lon)}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const json = (await res.json()) as PlacesApiResponse;
      if (!res.ok || !json.success) {
        setErrorKind("api_failure");
        setErrorMessage(!json.success ? json.error.message : "Service temporarily unavailable");
        setData([]);
        return;
      }
      setData(json.data);
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

