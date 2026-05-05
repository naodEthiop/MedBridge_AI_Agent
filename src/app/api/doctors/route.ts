import { NextResponse } from 'next/server';
import { getAuthUserFromRequest as getUserFromRequest } from '@/lib/server/authUser';
import { getRepositories } from '@/lib/server/repositories';

function demoDoctors() {
  return [
    { id: "1", fullName: "Dr. Smith", specialty: "General" }
  ];
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ ok: true, data: { doctors: demoDoctors() }, fallback: true });
    }

    const tenantId = user.tenantId || "demo-tenant";

    if (user.role !== 'patient') {
      return NextResponse.json({ ok: true, data: { doctors: demoDoctors() }, fallback: true });
    }

    const repos = getRepositories({ tenantId, userId: user.id, role: "patient" });
    const doctors = await repos.doctors.listDoctors();
    
    return NextResponse.json({ ok: true, data: { doctors } });
  } catch (error) {
    console.error("API ERROR [doctors]:", error);
    return NextResponse.json({ ok: true, data: { doctors: demoDoctors() }, fallback: true });
  }
}
