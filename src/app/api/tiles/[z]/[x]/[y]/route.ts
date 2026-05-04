import { NextResponse } from "next/server";

import { mapApiKey } from "@/lib/env";
import { fetchWithTimeout, jsonError } from "@/lib/server/http";
import { rateLimitOrThrow } from "@/lib/server/rateLimit";

function isIntString(v: string) {
  return /^[0-9]+$/.test(v);
}

export async function GET(req: Request, ctx: { params: Promise<{ z: string; x: string; y: string }> }) {
  if (!mapApiKey) {
    return NextResponse.json(jsonError("Goapify is not configured. Set GOAPIFY_API_KEY or GEOAPIFY_API_KEY."), { status: 500 });
  }

  try {
    rateLimitOrThrow({ req, key: "geoapify:tiles" });
  } catch (e) {
    const err = e as Error & { status?: number; retryAfter?: number };
    return NextResponse.json(jsonError(err.message), {
      status: err.status ?? 429,
      headers: err.retryAfter ? { "Retry-After": String(err.retryAfter) } : undefined,
    });
  }

  const { z, x, y } = await ctx.params;
  if (!isIntString(z) || !isIntString(x) || !isIntString(y)) {
    return NextResponse.json(jsonError("Invalid tile coordinates"), { status: 400 });
  }

  const tileUrl = `https://maps.geoapify.com/v1/tile/carto/${z}/${x}/${y}.png?apiKey=${encodeURIComponent(
    mapApiKey,
  )}`;

  try {
    const res = await fetchWithTimeout(tileUrl, {
      cache: "no-store",
      timeoutMs: 8000,
      headers: { Accept: "image/png,image/*;q=0.8,*/*;q=0.5" },
    });
    if (!res.ok) {
      return NextResponse.json(jsonError("Geoapify upstream error"), { status: 502 });
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    const msg = e instanceof Error && e.name === "AbortError" ? "Upstream timeout" : "Service temporarily unavailable";
    return NextResponse.json(jsonError(msg), { status: 502 });
  }
}

