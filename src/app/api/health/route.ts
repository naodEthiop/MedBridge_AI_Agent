import { NextResponse } from "next/server";

import { getRepositories } from "@/lib/server/repositories";

export async function GET() {
  const repos = getRepositories();
  return NextResponse.json({
    ok: true,
    source: repos.source,
  });
}

