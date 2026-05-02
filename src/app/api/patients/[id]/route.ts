import { NextResponse } from "next/server";

import { getRepositories } from "@/lib/server/repositories";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const repos = getRepositories();
  const patient = await repos.patients.getPatient(id);
  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const appointments = await repos.appointments.listAppointmentsForPatient(id);
  return NextResponse.json({ patient, appointments });
}

