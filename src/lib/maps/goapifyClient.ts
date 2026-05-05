import { fetchWithTimeout } from "@/lib/server/http";

export type GoapifyNearbyPlace = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  kind: "hospital" | "pharmacy" | "clinic";
  distanceMeters: number | null;
};

const demoPlaces: Array<Omit<GoapifyNearbyPlace, "distanceMeters">> = [
  {
    id: "demo-hospital-1",
    name: "Sahara General Hospital",
    address: "1 Desert Road, Addis Ababa",
    lat: 8.9843,
    lng: 38.7574,
    kind: "hospital",
  },
  {
    id: "demo-hospital-2",
    name: "Addis Sunrise Medical Center",
    address: "12 Bole Road, Addis Ababa",
    lat: 8.9772,
    lng: 38.7639,
    kind: "hospital",
  },
  {
    id: "demo-pharmacy-1",
    name: "Bole Pharmacy",
    address: "45 Main St, Addis Ababa",
    lat: 8.9814,
    lng: 38.7512,
    kind: "pharmacy",
  },
  {
    id: "demo-pharmacy-2",
    name: "Urgent Care Pharmacy",
    address: "88 Riverside Ave, Addis Ababa",
    lat: 8.9891,
    lng: 38.7627,
    kind: "pharmacy",
  },
];

function calculateDistance(lat: number, lng: number, otherLat: number, otherLng: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(otherLat - lat);
  const dLng = toRad(otherLng - lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat)) * Math.cos(toRad(otherLat)) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function fetchNearbyPlacesGoapify(args: {
  lat: number;
  lng: number;
  radiusM?: number;
  limit?: number;
  apiKey?: string;
}): Promise<{ ok: true; hospitals: GoapifyNearbyPlace[] } | { ok: false; error: string }> {
  const radius = args.radiusM ?? 5000;
  const limit = args.limit ?? 20;
  const apiKey = args.apiKey?.trim();

  if (!apiKey) {
    const hospitals = demoPlaces
      .map((place) => ({
        ...place,
        distanceMeters: Math.round(calculateDistance(args.lat, args.lng, place.lat, place.lng)),
      }))
      .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0))
      .slice(0, limit);

    return { ok: true, hospitals };
  }

  const url = `https://api.geoapify.com/v2/places?categories=healthcare.hospital,healthcare.pharmacy,healthcare.clinic&filter=circle:${encodeURIComponent(
    String(args.lng),
  )},${encodeURIComponent(String(args.lat))},${radius}&limit=${limit}&apiKey=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetchWithTimeout(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      timeoutMs: 7000,
    });
    if (!res.ok) {
      return { ok: false, error: "Goapify upstream error" };
    }

    const raw = (await res.json()) as {
      features?: Array<{ properties?: Record<string, unknown> }>;
    };

    const hospitals: GoapifyNearbyPlace[] =
      raw.features?.map((feature, idx) => {
        const p = (feature.properties ?? {}) as Record<string, unknown>;
        const name = String(p.name ?? "Unknown");
        const address = p.formatted
          ? String(p.formatted)
          : p.address_line1
            ? String(p.address_line1)
            : "Address unavailable";
        const outLat = typeof p.lat === "number" ? p.lat : args.lat;
        const outLng = typeof p.lon === "number" ? p.lon : args.lng;
        const categories = Array.isArray(p.categories) ? (p.categories as string[]) : [];
        const isPharmacy = categories.some((c) => c.includes("pharmacy"));
        const isClinic = categories.some((c) => c.includes("clinic"));
        const kind = isPharmacy ? "pharmacy" : isClinic ? "clinic" : "hospital";
        const distanceMeters = calculateDistance(args.lat, args.lng, outLat, outLng);
        return {
          id: String(p.place_id ?? `${outLat},${outLng}-${idx}`),
          name,
          address,
          lat: outLat,
          lng: outLng,
          kind,
          distanceMeters: Math.round(distanceMeters),
        };
      }) ?? [];

    return { ok: true, hospitals };
  } catch (e) {
    const msg = e instanceof Error && e.name === "AbortError" ? "Upstream timeout" : "Service temporarily unavailable";
    return { ok: false, error: msg };
  }
}
