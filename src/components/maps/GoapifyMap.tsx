"use client";

import { useEffect, useMemo, useState } from "react";

import { NearbyMedicalLeafletMap } from "@/components/patient/NearbyMedicalLeafletMap";
import type { GeoPlace } from "@/lib/geoapify/types";

export function GoapifyMap({
  initialCenter,
}: {
  initialCenter?: { lat: number; lng: number };
}) {
  const defaultCenter = useMemo(() => ({ lat: 8.9806, lng: 38.7578 }), []);
  const [center, setCenter] = useState(initialCenter ?? defaultCenter);
  const [places, setPlaces] = useState<GeoPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const url = `/api/map/nearby?lat=${encodeURIComponent(center.lat)}&lng=${encodeURIComponent(center.lng)}`;

    setLoading(true);
    setError(null);

    fetch(url, { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || json.ok !== true) {
          throw new Error(json.error?.message ?? "Unable to load nearby places");
        }
        const items = Array.isArray(json.data?.hospitals) ? json.data.hospitals : [];
        setPlaces(
          items.map((item: any) => ({
            id: String(item.id),
            name: String(item.name ?? "Unknown"),
            address: String(item.address ?? "Address unavailable"),
            kind: (item.kind === "pharmacy" ? "pharmacy" : "hospital") as "pharmacy" | "hospital",
            lat: Number(item.lat),
            lon: Number(item.lng),
            distanceMeters: typeof item.distanceMeters === "number" ? item.distanceMeters : null,
            categories: [] as string[],
          })),
        );
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message || "Failed to load nearby places");
        setPlaces([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [center]);

  const selectedPlace = places.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sahara-border/40 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-sahara-muted">Goapify Nearby Search</p>
            <p className="mt-1 text-sm text-sahara-muted">
              Showing nearby hospitals and pharmacies around {center.lat.toFixed(4)}, {center.lng.toFixed(4)}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCenter(defaultCenter)}
            className="rounded-xl border border-sahara-border bg-white px-4 py-2 text-sm font-semibold text-sahara-muted"
          >
            Reset
          </button>
        </div>
        {loading ? (
          <p className="mt-3 text-sm text-sahara-muted">Loading...</p>
        ) : error ? (
          <div className="mt-3 rounded-xl border border-red-300/40 bg-red-100/30 p-3 text-sm text-red-900">{error}</div>
        ) : (
          <div className="mt-3 grid gap-3">
            {places.length > 0 ? (
              places.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => setSelectedId(place.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedId === place.id ? "border-sahara-primary bg-sahara-primary/5" : "border-sahara-border/50 bg-white hover:bg-sahara-surface-low"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{place.name}</p>
                      <p className="mt-1 text-sm text-sahara-muted">{place.address}</p>
                    </div>
                    <span className="rounded-full bg-sahara-surface-low px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-sahara-muted">
                      {place.kind === "pharmacy" ? "Pharmacy" : "Hospital"}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-sahara-muted">No nearby places found.</p>
            )}
          </div>
        )}
      </div>

      <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-sahara-border/40 bg-sahara-surface-low">
        <NearbyMedicalLeafletMap
          center={center}
          places={places}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDirections={() => Promise.resolve()}
        />
      </div>

      {selectedPlace ? (
        <div className="rounded-2xl border border-sahara-border/40 bg-white p-4">
          <p className="font-semibold">Selected place</p>
          <p className="mt-2 text-sm text-sahara-muted">{selectedPlace.name}</p>
          <p className="mt-1 text-sm text-sahara-muted">{selectedPlace.address}</p>
          <p className="mt-1 text-sm text-sahara-muted">
            Distance: {selectedPlace.distanceMeters != null ? `${Math.round(selectedPlace.distanceMeters)} m` : "Unknown"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
