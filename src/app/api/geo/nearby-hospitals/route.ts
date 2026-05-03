import { NextResponse } from "next/server";

import { fetchNearbyHospitalsGeoapify } from "@/lib/geo/geoapify-nearby";
import { env } from "@/lib/env";
import { jsonError } from "@/lib/server/http";
import { rateLimitOrThrow } from "@/lib/server/rateLimit";

/**
 * GET /api/geo/nearby-hospitals?lat=&lng= (or lon=)
 * Returns hospitals / clinics near a point via Geoapify.
 */
export async function GET(req: Request) {
  if (!env.GEOAPIFY_API_KEY) {
    return NextResponse.json(jsonError("Geoapify is not configured. Set GEOAPIFY_API_KEY."), { status: 500 });
  }

  try {
    rateLimitOrThrow({ req, key: "geoapify:nearby-hospitals" });
  } catch (e) {
    const err = e as Error & { status?: number; retryAfter?: number };
    return NextResponse.json(jsonError(err.message), {
      status: err.status ?? 429,
      headers: err.retryAfter ? { "Retry-After": String(err.retryAfter) } : undefined,
    });
  }

  const { searchParams } = new URL(req.url);
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

  const result = await fetchNearbyHospitalsGeoapify({
    lat: latNum,
    lng: lngNum,
    apiKey: env.GEOAPIFY_API_KEY,
  });

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 502 });
  }

  const hospitals = result.hospitals.map((h) => ({
    name: h.name,
    lat: h.lat,
    lng: h.lng,
    address: h.address,
  }));

  return NextResponse.json({ success: true, hospitals });
}
