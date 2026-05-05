import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json({ success: false, error: "Missing coordinates" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }

    // We use a raw query via rpc or a specialized search if available.
    // For standard Supabase + Earthdistance, we typically use an RPC function:
    // 'get_nearby_doctors(lat, lng)'
    
    // Fallback: If no RPC exists, we fetch and filter (not ideal but safe for demo)
    // Actually, let's assume 'nearby_search' RPC is implemented or use a standard select.
    
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .limit(20);

    if (error) throw error;

    // Simulate distance sorting if earth_distance isn't ready in DB
    const results = (data || []).map(d => ({
      ...d,
      distance: Math.sqrt(Math.pow(Number(d.lat) - Number(lat), 2) + Math.pow(Number(d.lng) - Number(lng), 2)) * 111 // rough km
    })).sort((a, b) => a.distance - b.distance);

    return NextResponse.json({ success: true, data: results });

  } catch (err) {
    console.error("[NEARBY ERROR]", err);
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : "Internal server error" 
    }, { status: 500 });
  }
}
