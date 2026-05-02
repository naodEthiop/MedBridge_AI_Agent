import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    message: "Client should clear local Supabase session via supabase.auth.signOut().",
  });
}
