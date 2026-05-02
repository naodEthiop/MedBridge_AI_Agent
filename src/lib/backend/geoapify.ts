import { env } from "@/lib/env";

export type GeoapifyPlace = {
  id: string;
  name: string;
  address: string | null;
  distanceMeters: number | null;
  lat: number;
  lng: number;
  categories: string[];
  phone: string | null;
  website: string | null;
};

function requireGeoapifyKey() {
  if (!env.GEOAPIFY_API_KEY) throw new Error("Geoapify is not configured. Set GEOAPIFY_API_KEY.");
  return env.GEOAPIFY_API_KEY;
}

function buildPlacesUrl(params: Record<string, string>) {
  const url = new URL("https://api.geoapify.com/v2/places");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("apiKey", requireGeoapifyKey());
  return url.toString();
}

export async function geoapifyNearbyPlaces(args: {
  lat: number;
  lng: number;
  categories: string[];
  radiusMeters?: number;
  limit?: number;
}) {
  const { lat, lng, categories, radiusMeters = 6000, limit = 20 } = args;
  const url = buildPlacesUrl({
    filter: `circle:${lng},${lat},${radiusMeters}`,
    bias: `proximity:${lng},${lat}`,
    categories: categories.join(","),
    limit: String(limit),
    lang: "en",
  });

  const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  const json = (await res.json()) as {
    features?: Array<{
      properties?: Record<string, unknown>;
      geometry?: { coordinates?: [number, number] };
    }>;
  };

  const features = json.features ?? [];
  return features
    .map((f) => {
      const p = (f.properties ?? {}) as Record<string, unknown>;
      const coords = f.geometry?.coordinates;
      const lng2 = Array.isArray(coords) ? coords[0] : null;
      const lat2 = Array.isArray(coords) ? coords[1] : null;
      const placeId = String(p.place_id ?? p.datasource?.toString?.() ?? `${lat2},${lng2}`);
      const name = String(p.name ?? p.address_line1 ?? p.street ?? "Unknown");
      const address = p.formatted ? String(p.formatted) : p.address_line2 ? String(p.address_line2) : null;
      const distance = typeof p.distance === "number" ? p.distance : null;
      const cats = Array.isArray(p.categories) ? (p.categories as string[]) : [];
      const contact =
        p.contact && typeof p.contact === "object" ? (p.contact as Record<string, unknown>) : null;
      const phone =
        contact && typeof contact.phone === "string"
          ? contact.phone
          : typeof p.phone === "string"
            ? (p.phone as string)
            : null;
      return {
        id: placeId,
        name,
        address,
        distanceMeters: distance,
        lat: typeof lat2 === "number" ? lat2 : lat,
        lng: typeof lng2 === "number" ? lng2 : lng,
        categories: cats,
        phone,
        website: typeof p.website === "string" ? p.website : null,
      } satisfies GeoapifyPlace;
    })
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
}

