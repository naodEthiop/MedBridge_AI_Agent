import { NextResponse } from "next/server";

import { getNearbyPharmacies } from "@/lib/backend/mcp";

export async function POST(req: Request) {
  const { medicine, latitude, longitude } = (await req.json()) as {
    medicine?: string;
    latitude?: number;
    longitude?: number;
  };

  const pharmacies = await getNearbyPharmacies(medicine ?? "", latitude, longitude);
  return NextResponse.json({
    pharmacies,
    mapEnabled: true,
    location: typeof latitude === "number" && typeof longitude === "number" ? { latitude, longitude } : null,
  });
}

