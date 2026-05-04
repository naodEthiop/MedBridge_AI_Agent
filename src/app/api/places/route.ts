import { NextResponse } from "next/server";

import { fetchNearbyHospitalsGeoapify } from "@/lib/geo/geoapify-nearby";
import { mapApiKey } from "@/lib/env";
import { jsonError } from "@/lib/server/http";
import { rateLimitOrThrow } from "@/lib/server/rateLimit";

export async function GET(req: Request) {
  if (!mapApiKey) {
    return NextResponse.json(
      jsonError("Goapify is not configured. Set GOAPIFY_API_KEY or GEOAPIFY_API_KEY."),
      { status: 500 },
    );
  }

  try {
    rateLimitOrThrow({ req, key: "geoapify:places" });
  } catch (e) {
    const err = e as Error & { status?: number; retryAfter?: number };
    return NextResponse.json(
      jsonError(err.message),
      {
        status: err.status ?? 429,
        headers: err.retryAfter ? { "Retry-After": String(err.retryAfter) } : undefined,
      },
    );
  }

  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  if (!lat || !lon) {
    return NextResponse.json(jsonError("Missing coordinates"), { status: 400 });
  }
  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum) || Math.abs(latNum) > 90 || Math.abs(lonNum) > 180) {
    return NextResponse.json(jsonError("Invalid coordinates"), { status: 400 });
  }

  const result = await fetchNearbyHospitalsGeoapify({
    lat: latNum,
    lng: lonNum,
    apiKey: mapApiKey,
  });

  if (!result.ok) {
    return NextResponse.json(jsonError(result.error), { status: 502 });
  }

  const items = result.hospitals.map((h, idx) => ({
    id: h.id ?? `${h.lat}-${h.lng}-${idx}`,
    name: h.name,
    address: h.address,
    categories: [] as string[],
    kind: h.kind ?? "hospital",
    lat: h.lat,
    lon: h.lng,
    distanceMeters: null as number | null,
  }));

  return NextResponse.json({ success: true, data: items, count: items.length });
}

