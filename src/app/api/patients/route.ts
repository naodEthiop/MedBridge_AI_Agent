import { NextResponse } from 'next/server';
import { getAuthUserFromRequest as getUserFromRequest } from '@/lib/server/authUser';
import { getRepositories } from '@/lib/server/repositories';

function demoPatients() {
  return [
    { id: "1", fullName: "John Doe", isDemo: true }
  ];
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ ok: true, data: { patients: demoPatients() }, fallback: true });
    }

    const tenantId = user.tenantId || "demo-tenant";
    
    if (user.role !== 'doctor') {
      return NextResponse.json({ ok: true, data: { patients: demoPatients() }, fallback: true });
    }

    const repos = getRepositories({ tenantId, userId: user.id, role: "doctor" });
    const patients = await repos.patients.listPatients();
    
    return NextResponse.json({ ok: true, data: { patients } });
  } catch (error) {
    console.error("API ERROR [patients]:", error);
    return NextResponse.json({ ok: true, data: { patients: demoPatients() }, fallback: true });
  }
}
