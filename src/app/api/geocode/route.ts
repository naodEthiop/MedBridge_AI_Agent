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
    rateLimitOrThrow({ req, key: "geoapify:geocode" });
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
  const text = searchParams.get("text");
  if (!text || !text.trim()) {
    return NextResponse.json(jsonError("Missing search text"), { status: 400 });
  }

  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
    text.trim(),
  )}&apiKey=${encodeURIComponent(env.GEOAPIFY_API_KEY)}`;

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
      raw.features?.slice(0, 10).map((f, idx) => {
        const p = (f.properties ?? {}) as Record<string, unknown>;
        const lat = typeof p.lat === "number" ? p.lat : null;
        const lon = typeof p.lon === "number" ? p.lon : null;
        const formatted = p.formatted ? String(p.formatted) : null;
        const name = p.name ? String(p.name) : formatted;
        return { id: String(p.place_id ?? `${lat},${lon}-${idx}`), name, formatted, lat, lon };
      }) ?? [];
    return NextResponse.json({ success: true, data: items, count: items.length });
  } catch (e) {
    const msg = e instanceof Error && e.name === "AbortError" ? "Upstream timeout" : "Service temporarily unavailable";
    return NextResponse.json(jsonError(msg), { status: 502 });
  }
}

