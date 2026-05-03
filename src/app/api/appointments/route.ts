import { NextResponse } from "next/server";

import { hasSupabasePublicEnv } from "@/lib/env";
import { getRepositories } from "@/lib/server/repositories";

export async function GET() {
  try {
    const repos = getRepositories();
    const appointments = await repos.appointments.listAppointments();
    const source = hasSupabasePublicEnv ? "supabase" as const : "fallback" as const;
    return NextResponse.json({ ok: true, appointments, source });
  } catch {
    return NextResponse.json({ ok: true, appointments: [], source: "fallback" as const });
  }
}

