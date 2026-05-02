"use client";

import { useState } from "react";

import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyCare } from "@/hooks/useNearbyCare";

export function CareFinderClient() {
  const geo = useGeolocation();
  const nearbyQ = useNearbyCare(geo.location);
  const [selected, setSelected] = useState<string | null>(null);

  const places = (nearbyQ.data?.result?.places ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-sahara-surface-low p-4 ring-1 ring-sahara-border/60">
          <p className="font-semibold">Nearby care</p>
          {geo.loading ? <p className="mt-2 text-sm text-sahara-muted">Fetching your location…</p> : null}
          {geo.error ? <p className="mt-2 text-sm text-sahara-tertiary">{geo.error}</p> : null}
          {nearbyQ.isLoading ? <p className="mt-2 text-sm text-sahara-muted">Loading nearby places…</p> : null}
          {nearbyQ.error ? (
            <p className="mt-2 text-sm text-sahara-tertiary">Failed to load nearby places.</p>
          ) : null}
          <ul className="mt-2 space-y-1 text-sm text-sahara-muted">
            {places.slice(0, 8).map((p) => (
              <li key={String(p.id ?? p.name)}>
                <button
                  type="button"
                  onClick={() => setSelected(String(p.id ?? p.name))}
                  className={`w-full text-left hover:underline ${
                    selected && selected === String(p.id ?? p.name) ? "text-sahara-primary" : ""
                  }`}
                >
                  {String(p.name)}{" "}
                  {p.distanceMeters != null
                    ? `· ${(Number(p.distanceMeters) / 1000).toFixed(1)} km`
                    : ""}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-sahara-surface-low p-4 ring-1 ring-sahara-border/60">
          <p className="font-semibold">Selected</p>
          <div className="mt-2 rounded-xl border border-sahara-border/60 bg-white p-3 text-sm text-sahara-muted">
            {selected ? (
              <span>Tap “Map” above to view this location.</span>
            ) : (
              <span>Select a facility from the list.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

