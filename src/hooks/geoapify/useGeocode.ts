"use client";

import { useCallback, useRef, useState } from "react";

import type { GeocodeApiResponse, GeocodeItem } from "@/lib/geoapify/types";

export type GeocodeErrorKind = "api_failure" | "network" | "empty" | "unknown";

export function useGeocode() {
  const [results, setResults] = useState<GeocodeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorKind, setErrorKind] = useState<GeocodeErrorKind | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (text: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setErrorKind(null);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/geocode?text=${encodeURIComponent(text)}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const json = (await res.json()) as GeocodeApiResponse;
      if (!res.ok || !json.success) {
        setErrorKind("api_failure");
        setErrorMessage(!json.success ? json.error.message : "Service temporarily unavailable");
        setResults([]);
        return null;
      }
      setResults(json.data);
      if (!json.data.length) {
        setErrorKind("empty");
        setErrorMessage("No results found");
        return null;
      }
      const best = json.data[0];
      if (best.lat == null || best.lon == null) return null;
      return { lat: best.lat, lon: best.lon, label: best.formatted ?? best.name ?? "Search result" };
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return null;
      setErrorKind("network");
      setErrorMessage("Check your internet connection");
      setResults([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, errorKind, errorMessage, search };
}

