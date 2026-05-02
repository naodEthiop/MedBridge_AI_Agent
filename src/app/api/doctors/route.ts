import { NextResponse } from "next/server";

import { getRepositories } from "@/lib/server/repositories";

export async function GET() {
  const repos = getRepositories();
  const doctors = await repos.doctors.listDoctors();
  return NextResponse.json({ doctors });
}

