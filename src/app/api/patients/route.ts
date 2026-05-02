import { NextResponse } from "next/server";

import { getRepositories } from "@/lib/server/repositories";

export async function GET() {
  const repos = getRepositories();
  const patients = await repos.patients.listPatients();
  return NextResponse.json({ patients });
}

