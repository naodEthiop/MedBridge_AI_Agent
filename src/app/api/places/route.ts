import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { fetchWithTimeout, jsonError } from "@/lib/server/http";
import { rateLimitOrThrow } from "@/lib/server/rateLimit";

export async function GET(req: Request) {
  if (!env.GEOAPIFY_API_KEY) {
    return NextResponse.json(
      jsonError("Geoapify is not configured. Set GEOAPIFY_API_KEY."),
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

  const url = `https://api.geoapify.com/v2/places?categories=healthcare.hospital,healthcare.pharmacy&filter=circle:${encodeURIComponent(
    String(lonNum),
  )},${encodeURIComponent(String(latNum))},5000&limit=20&apiKey=${encodeURIComponent(env.GEOAPIFY_API_KEY)}`;

  try {
    const res = await fetchWithTimeout(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      timeoutMs: 7000,
    });
    if (!res.ok) {
      return NextResponse.json(jsonError("Geoapify upstream error"), { status: 502 });
    }
    const raw = (await res.json()) as {
      features?: Array<{ properties?: Record<string, unknown> }>;
    };

    const items =
      raw.features?.map((f, idx) => {
        const p = (f.properties ?? {}) as Record<string, unknown>;
        const id = String(p.place_id ?? `${p.lat ?? latNum},${p.lon ?? lonNum}-${idx}`);
        const name = String(p.name ?? "Unknown");
        const address = p.formatted
          ? String(p.formatted)
          : p.address_line2
            ? String(p.address_line2)
            : p.address_line1
              ? String(p.address_line1)
              : "Address unavailable";
        const categories = Array.isArray(p.categories) ? (p.categories as string[]) : [];
        const kind = categories.some((c) => c.includes("pharmacy")) ? "pharmacy" : "hospital";
        const distanceMeters = typeof p.distance === "number" ? p.distance : null;
        const outLat = typeof p.lat === "number" ? p.lat : latNum;
        const outLon = typeof p.lon === "number" ? p.lon : lonNum;
        return { id, name, address, categories, kind, lat: outLat, lon: outLon, distanceMeters };
      }) ?? [];

    return NextResponse.json({ success: true, data: items, count: items.length });
  } catch (e) {
    const msg = e instanceof Error && e.name === "AbortError" ? "Upstream timeout" : "Service temporarily unavailable";
    return NextResponse.json(jsonError(msg), { status: 502 });
  }
}

