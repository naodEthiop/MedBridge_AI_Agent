import { NextResponse } from "next/server";

import { DEMO_APPOINTMENTS } from "@/lib/server/demo-appointments";
import { getRepositories } from "@/lib/server/repositories";

export async function GET() {
  try {
    const repos = getRepositories();
    const appointments = await repos.appointments.listAppointments();
    if (!appointments.length) {
      return NextResponse.json({ ok: true, appointments: DEMO_APPOINTMENTS, source: "demo" as const });
    }
    return NextResponse.json({ ok: true, appointments, source: "supabase" as const });
  } catch {
    return NextResponse.json({ ok: true, appointments: DEMO_APPOINTMENTS, source: "demo" as const });
  }
}

