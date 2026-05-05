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
    
    if (user.role !== 'doctor') {
      return NextResponse.json({ ok: false, error: 'Forbidden: Doctors only' }, { status: 403 });
    }

    const repos = getRepositories({ tenantId, userId: user.userId, role: "doctor" });
    const patients = await repos.patients.listPatients();
    
    return NextResponse.json({ ok: true, data: { patients } });
  } catch (error) {
    console.error("API ERROR [patients]:", error);
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
