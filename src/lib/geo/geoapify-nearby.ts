import { fetchWithTimeout } from "@/lib/server/http";

export type NearbyHospitalItem = {
  name: string;
  lat: number;
  lng: number;
  address: string;
  id?: string;
  kind?: string;
};

/**
 * Healthcare places near a point via Geoapify Places API (hospitals + pharmacies in circle).
 */
export async function fetchNearbyHospitalsGeoapify(args: {
  lat: number;
  lng: number;
  apiKey: string;
  radiusM?: number;
  limit?: number;
}): Promise<{ ok: true; hospitals: NearbyHospitalItem[] } | { ok: false; error: string }> {
  const radius = args.radiusM ?? 5000;
  const limit = args.limit ?? 20;
  const url = `https://api.geoapify.com/v2/places?categories=healthcare.hospital,healthcare.pharmacy&filter=circle:${encodeURIComponent(
    String(args.lng),
  )},${encodeURIComponent(String(args.lat))},${radius}&limit=${limit}&apiKey=${encodeURIComponent(args.apiKey)}`;

  try {
    const res = await fetchWithTimeout(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      timeoutMs: 7000,
    });
    if (!res.ok) {
      return { ok: false, error: "Geoapify upstream error" };
    }
    const raw = (await res.json()) as {
      features?: Array<{ properties?: Record<string, unknown> }>;
    };

    const hospitals: NearbyHospitalItem[] =
      raw.features?.map((f, idx) => {
        const p = (f.properties ?? {}) as Record<string, unknown>;
        const name = String(p.name ?? "Unknown");
        const address = p.formatted
          ? String(p.formatted)
          : p.address_line1
            ? String(p.address_line1)
            : "Address unavailable";
        const outLat = typeof p.lat === "number" ? p.lat : args.lat;
        const outLon = typeof p.lon === "number" ? p.lon : args.lng;
        const categories = Array.isArray(p.categories) ? (p.categories as string[]) : [];
        const kind = categories.some((c) => c.includes("pharmacy")) ? "pharmacy" : "hospital";
        return {
          id: String(p.place_id ?? `${outLat},${outLon}-${idx}`),
          name,
          lat: outLat,
          lng: outLon,
          address,
          kind,
        };
      }) ?? [];

    return { ok: true, hospitals };
  } catch (e) {
    const msg = e instanceof Error && e.name === "AbortError" ? "Upstream timeout" : "Service temporarily unavailable";
    return { ok: false, error: msg };
  }
}
