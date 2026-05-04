import { NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/lib/server/authUser';
import { getRepositories } from '@/lib/server/repositories';

function demoPatients() {
  return [
    { id: "1", fullName: "John Doe", isDemo: true }
  ];
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return Response.json({ ok: true, data: { patients: demoPatients() }, fallback: true }, { status: 200 });
    }

    const tenantId = user.tenantId || "demo-tenant";
    
    // Check role, but fallback instead of 403
    if (user.role !== 'doctor') {
      return Response.json({ ok: true, data: { patients: demoPatients() }, fallback: true }, { status: 200 });
    }

    const repos = getRepositories({ tenantId, userId: user.id, role: "doctor" });
    const patients = await repos.patients.listPatients();
    
    return Response.json({ ok: true, data: { patients } }, { status: 200 });
  } catch (error) {
    console.error("API ERROR:", error);
    return Response.json({ ok: true, data: { patients: demoPatients() }, fallback: true }, { status: 200 });
  }
}

