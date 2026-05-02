import { NextResponse } from "next/server";

import { getRepositories } from "@/lib/server/repositories";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    providerName?: string;
    licenseNumber?: string;
    clinic?: string;
  };

  const providerName = body.providerName?.trim();
  if (!providerName) {
    return NextResponse.json({ error: "providerName is required" }, { status: 400 });
  }

  const repos = getRepositories();
  const doctors = await repos.doctors.listDoctors();
  const matched = doctors.find((d) => d.fullName.toLowerCase().includes(providerName.toLowerCase()));

  return NextResponse.json({
    providerName,
    verified: !!matched,
    status: matched ? "verified" : "not_found",
    details: matched
      ? {
          doctorId: matched.id,
          specialty: matched.specialty,
          clinic: matched.clinicName ?? body.clinic ?? null,
          note: "Provider matched existing doctor records.",
        }
      : {
          note: "No matching provider record found in current backend data.",
        },
    submitted: {
      licenseNumber: body.licenseNumber ?? null,
      clinic: body.clinic ?? null,
    },
  });
}

