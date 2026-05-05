import { NextResponse } from 'next/server';
import { resolveSessionPrincipal } from '@/lib/server/sessionPrincipal';
import { getRepositories } from '@/lib/server/repositories';

export async function GET(request: Request) {
  try {
    const user = await resolveSessionPrincipal(request);

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.tenantId || "demo-tenant";

    if (user.role !== 'patient') {
      return NextResponse.json({ ok: false, error: 'Forbidden: Patients only' }, { status: 403 });
    }

    const repos = getRepositories({ tenantId, userId: user.userId, role: "patient" });
    const doctors = await repos.doctors.listDoctors();
    
    return NextResponse.json({ ok: true, data: { doctors } });
  } catch (error) {
    console.error("API ERROR [doctors]:", error);
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
