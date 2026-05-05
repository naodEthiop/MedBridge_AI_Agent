"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useNearbyDoctors } from "@/hooks/useNearbyDoctors";

const LeafletMap = dynamic(
  () => import("./NearbyMedicalLeafletMap").then((m) => m.NearbyMedicalLeafletMap),
  { ssr: false },
);

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-sahara-border/50 bg-white p-4">
      <div className="h-5 w-2/3 rounded bg-sahara-surface-low" />
      <div className="mt-3 h-4 w-full rounded bg-sahara-surface-low" />
      <div className="mt-2 h-4 w-5/6 rounded bg-sahara-surface-low" />
      <div className="mt-4 flex gap-2">
        <div className="h-7 w-20 rounded bg-sahara-surface-low" />
        <div className="h-7 w-24 rounded bg-sahara-surface-low" />
      </div>
    </div>
  );
}

export function NearbyMedicalMap() {
  const defaultLocation = useMemo(() => ({ lat: 8.9806, lng: 38.7578 }), []);
  const [location, setLocation] = useState<{ lat: number; lng: number }>(defaultLocation);
  const [locationMode, setLocationMode] = useState<"geo" | "default" | "search" | "denied">("default");

  const [view, setView] = useState<"list" | "map">("map");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  const { data: places, isLoading: loading, error } = useNearbyDoctors(location);

  const selected = (places || []).find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationMode("default");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });
        setLocationMode("geo");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocationMode("denied");
        } else {
          setLocationMode("default");
        }
        setLocation(defaultLocation);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
    );
  }, [defaultLocation]);

  async function onRefresh() {
    // React Query handle refresh
  }

  async function onSearch() {
    // Simplified search logic
  }

  async function onGetDirections(place: any) {
    setSelectedId(place.id);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`, '_blank');
  }

  const topError =
    locationMode === "denied"
      ? "Please enable location access for the best experience"
      : error
        ? "Service temporarily unavailable"
        : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-sahara-border/60 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-sahara-muted">Nearby medical services</p>
            <p className="mt-1 text-sm text-sahara-muted">
              Location:{" "}
              <span className="font-semibold text-sahara-fg">
                {locationMode === "geo"
                  ? "Using your location"
                  : locationMode === "search"
                    ? "Search result"
                    : locationMode === "denied"
                      ? "Location access denied"
                    : "Default location"}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-sahara-border bg-sahara-surface p-1">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm transition ${
                view === "list" ? "bg-white text-sahara-primary" : "text-sahara-muted"
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setView("map")}
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                view === "map" ? "bg-white text-sahara-primary shadow-sm" : "text-sahara-muted"
              }`}
            >
              Map
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search area (e.g. ‘Bole, Addis Ababa’)"
            className="w-full rounded-xl border border-sahara-border/70 px-3 py-2 text-sm outline-none focus:border-sahara-primary"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSearch}
              disabled={loading || !query.trim()}
              className="rounded-xl bg-sahara-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
            >
              Search
            </button>
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="rounded-xl border border-sahara-border bg-white px-4 py-2 text-sm font-semibold text-sahara-muted disabled:opacity-70"
            >
              Refresh
            </button>
          </div>
        </div>

        {topError ? (
          <div className="rounded-xl border border-red-300/40 bg-red-100/30 p-3 text-sm text-red-900">
            {topError}
          </div>
        ) : null}
        {loading ? <p className="text-sm text-sahara-muted">Loading…</p> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-5">
          <div className="rounded-2xl border border-sahara-border/40 bg-white p-4">
            <p className="font-semibold">Results</p>
            <div className="mt-3 space-y-2">
              {loading ? (
                <div className="space-y-2">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : places && places.length ? (
                places.map((p) => (
                  <div
                    key={p.id}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedId === p.id
                        ? "border-sahara-primary bg-sahara-primary/5"
                        : "border-sahara-border/50 bg-white hover:bg-sahara-surface-low"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <button type="button" onClick={() => setSelectedId(p.id)} className="text-left">
                          <p className="font-serif text-lg">{p.name}</p>
                        </button>
                        <p className="mt-1 text-sm text-sahara-muted">{p.address}</p>
                        <p className="mt-2 text-xs text-sahara-muted">
                          {p.distanceMeters != null ? `${(p.distanceMeters / 1000).toFixed(1)} km away` : "Distance unavailable"}
                        </p>
                      </div>
                      <span className="rounded-full bg-sahara-surface-low px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-sahara-muted">
                        {p.kind === "doctor" ? "Doctor" : "Hospital"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onGetDirections(p)}
                        disabled={loading}
                        className="rounded-xl bg-sahara-fg px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                      >
                        Get Directions
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(p.id);
                          setView("map");
                        }}
                        className="rounded-xl border border-sahara-border bg-white px-4 py-2 text-sm font-semibold text-sahara-muted disabled:opacity-70"
                      >
                        View on Map
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-sahara-muted">No nearby medical services found</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-sahara-border/40 bg-white p-4">
            <p className="font-semibold">Directions</p>
            <p className="mt-1 text-sm text-sahara-muted">
              {selected ? `Selected: ${selected.name}` : "Select a professional to get directions."}
            </p>
          </div>
        </div>

        <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-sahara-border/40 bg-sahara-surface-low lg:col-span-7">
          {view === "map" ? (
            <LeafletMap
              center={location}
              places={places || []}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDirections={onGetDirections}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-white/30">
              <div className="max-w-md rounded-3xl border border-white/30 bg-white/80 p-8 text-center shadow-2xl backdrop-blur-md">
                <p className="text-xs font-bold uppercase tracking-widest text-sahara-muted">List view</p>
                <p className="mt-2 text-sm text-sahara-muted">
                  Switch to <span className="font-semibold text-sahara-fg">Map</span> to view markers.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
