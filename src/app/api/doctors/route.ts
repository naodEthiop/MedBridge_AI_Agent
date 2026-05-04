import { NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/lib/server/authUser';
import { getRepositories } from '@/lib/server/repositories';

function demoDoctors() {
  return [
    { id: "1", fullName: "Dr. Smith", specialty: "General" }
  ];
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return Response.json({ ok: true, data: { doctors: demoDoctors() }, fallback: true }, { status: 200 });
    }

    const tenantId = user.tenantId || "demo-tenant";

    if (user.role !== 'patient') {
      return Response.json({ ok: true, data: { doctors: demoDoctors() }, fallback: true }, { status: 200 });
    }

    const repos = getRepositories({ tenantId, userId: user.id, role: "patient" });
    const doctors = await repos.doctors.listDoctors();
    
    return Response.json({ ok: true, data: { doctors } }, { status: 200 });
  } catch (error) {
    console.error("API ERROR:", error);
    return Response.json({ ok: true, data: { doctors: demoDoctors() }, fallback: true }, { status: 200 });
  }
}

