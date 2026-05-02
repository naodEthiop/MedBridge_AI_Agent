import { NextResponse } from "next/server";

import { getRepositories } from "@/lib/server/repositories";
import { getAuthUserFromRequest } from "@/lib/server/authUser";

export async function GET(req: Request) {
  const user = await getAuthUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const repos = getRepositories();
    const patient = await repos.patients.getPatient(user.id);
    const doctor = patient ? null : await repos.doctors.getDoctor(user.id);

    return NextResponse.json({
      ok: true,
      profile: {
        id: user.id,
        email: user.email,
        role: user.role,
        patient,
        doctor,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load profile";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
