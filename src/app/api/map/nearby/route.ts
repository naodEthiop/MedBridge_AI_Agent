import { NextResponse } from "next/server";

import { fetchNearbyPlacesGoapify } from "@/lib/maps/goapifyClient";
import { mapApiKey } from "@/lib/env";
import { jsonError } from "@/lib/server/http";
import { rateLimitOrThrow } from "@/lib/server/rateLimit";

export async function GET(request: Request) {
  try {
    rateLimitOrThrow({ req: request, key: "goapify:nearby" });
  } catch (e) {
    const err = e as Error & { status?: number; retryAfter?: number };
    return NextResponse.json(jsonError(err.message), {
      status: err.status ?? 429,
      headers: err.retryAfter ? { "Retry-After": String(err.retryAfter) } : undefined,
    });
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng") ?? searchParams.get("lon");
  if (!lat || !lng) {
    return NextResponse.json(jsonError("Missing lat and lng (or lon)"), { status: 400 });
  }

  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum) || Math.abs(latNum) > 90 || Math.abs(lngNum) > 180) {
    return NextResponse.json(jsonError("Invalid coordinates"), { status: 400 });
  }

  const result = await fetchNearbyPlacesGoapify({
    lat: latNum,
    lng: lngNum,
    apiKey: mapApiKey,
  });

  if (!result.ok) {
    return NextResponse.json(jsonError(result.error), { status: 502 });
  }

  return NextResponse.json({ ok: true, data: { hospitals: result.hospitals } });
}
