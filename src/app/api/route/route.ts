import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { fetchWithTimeout, jsonError } from "@/lib/server/http";
import { rateLimitOrThrow } from "@/lib/server/rateLimit";

function parseWaypoint(value: string) {
  const parts = value.split(",").map((p) => p.trim());
  if (parts.length !== 2) return null;
  const lat = Number(parts[0]);
  const lon = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

export async function GET(req: Request) {
  if (!env.GEOAPIFY_API_KEY) {
    return NextResponse.json(
      jsonError("Geoapify is not configured. Set GEOAPIFY_API_KEY."),
      { status: 500 },
    );
  }

  try {
    rateLimitOrThrow({ req, key: "geoapify:routing" });
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
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(jsonError("Missing `from` or `to`"), { status: 400 });
  }

  const fromPoint = parseWaypoint(from);
  const toPoint = parseWaypoint(to);
  if (!fromPoint || !toPoint) {
    return NextResponse.json(jsonError("Invalid `from` or `to` coordinates"), { status: 400 });
  }

  const url = `https://api.geoapify.com/v1/routing?waypoints=${encodeURIComponent(
    from,
  )}|${encodeURIComponent(to)}&mode=drive&apiKey=${encodeURIComponent(env.GEOAPIFY_API_KEY)}`;

  try {
    const res = await fetchWithTimeout(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      timeoutMs: 8000,
    });
    if (!res.ok) {
      return NextResponse.json(jsonError("Geoapify upstream error"), { status: 502 });
    }
    const raw = (await res.json()) as {
      features?: Array<{ properties?: Record<string, unknown> }>;
    };
    const props = (raw.features?.[0]?.properties ?? {}) as Record<string, unknown>;
    const distanceMeters = typeof props.distance === "number" ? props.distance : null;
    const timeSeconds = typeof props.time === "number" ? props.time : null;
    const data = {
      from: fromPoint,
      to: toPoint,
      distanceKm: distanceMeters != null ? Math.round((distanceMeters / 1000) * 10) / 10 : null,
      durationMin: timeSeconds != null ? Math.round(timeSeconds / 60) : null,
    };
    return NextResponse.json({ success: true, data, count: 1 });
  } catch (e) {
    const msg = e instanceof Error && e.name === "AbortError" ? "Upstream timeout" : "Service temporarily unavailable";
    return NextResponse.json(jsonError(msg), { status: 502 });
  }
}

