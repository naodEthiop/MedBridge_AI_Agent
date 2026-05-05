import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const type = searchParams.get("type") || "hospital";

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("[MAP ERROR] Missing GOOGLE_MAPS_API_KEY");
      return NextResponse.json({ places: [], error: "Map service not configured" }, { status: 200 });
    }

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${type}&key=${apiKey}`;
    
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("[MAP ERROR] Google Maps API error", data.status, data.error_message);
      return NextResponse.json({ places: [], error: data.status }, { status: 200 });
    }

    // Map Google results to our NearbyPlace format
    const places = (data.results || []).map((p: any) => ({
      id: p.place_id,
      name: p.name,
      address: p.vicinity,
      location: p.geometry?.location,
      rating: p.rating,
      user_ratings_total: p.user_ratings_total,
      types: p.types,
      business_status: p.business_status
    }));

    return NextResponse.json({
      places,
      status: data.status
    });

  } catch (err) {
    console.error("[MAP ERROR]", err);
    return NextResponse.json({
      places: [],
      error: "Map service unavailable"
    }, { status: 200 });
  }
}
