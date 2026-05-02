import { NextResponse } from "next/server";

import { getRepositories } from "@/lib/server/repositories";

export async function GET() {
  const repos = getRepositories();
  const appointments = await repos.appointments.listAppointments();
  return NextResponse.json({ appointments });
}

