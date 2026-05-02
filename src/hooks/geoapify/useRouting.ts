"use client";

import { useCallback, useRef, useState } from "react";

import type { RoutingApiResponse, RoutingResult } from "@/lib/geoapify/types";

export type RoutingErrorKind = "api_failure" | "network" | "unknown";

export function useRouting() {
  const [route, setRoute] = useState<RoutingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorKind, setErrorKind] = useState<RoutingErrorKind | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const getRoute = useCallback(async (args: { from: { lat: number; lon: number }; to: { lat: number; lon: number } }) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setErrorKind(null);
    setErrorMessage(null);

    try {
      const from = `${args.from.lat},${args.from.lon}`;
      const to = `${args.to.lat},${args.to.lon}`;
      const res = await fetch(`/api/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const json = (await res.json()) as RoutingApiResponse;
      if (!res.ok || !json.success) {
        setErrorKind("api_failure");
        setErrorMessage(!json.success ? json.error.message : "Service temporarily unavailable");
        setRoute(null);
        return null;
      }
      setRoute(json.data);
      return json.data;
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return null;
      setErrorKind("network");
      setErrorMessage("Check your internet connection");
      setRoute(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { route, loading, errorKind, errorMessage, getRoute };
}

