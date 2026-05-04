import { NextResponse } from 'next/server';

import { getAuthenticatedUser, UnauthorizedError } from '@/lib/server/auth';
import { getRepositories, repositoryPrincipalFromAuthenticatedUser } from '@/lib/server/repositories';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (user.role !== 'doctor') {
      return NextResponse.json({ ok: false, error: 'Only doctors may view patient lists' }, { status: 403 });
    }

    const repos = getRepositories(repositoryPrincipalFromAuthenticatedUser(user));
    const patients = await repos.patients.listPatients();
    return NextResponse.json({ ok: true, data: { patients } });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Unable to fetch patients';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

