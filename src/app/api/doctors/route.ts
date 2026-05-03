import { NextResponse } from 'next/server';

import { getAuthenticatedUser, UnauthorizedError } from '@/lib/server/auth';
import { getRepositories } from '@/lib/server/repositories';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (user.role !== 'patient') {
      return NextResponse.json({ ok: false, error: 'Only patients may view doctor listings' }, { status: 403 });
    }

    const repos = getRepositories();
    const doctors = await repos.doctors.listDoctors();
    return NextResponse.json({ ok: true, data: { doctors } });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Unable to fetch doctors';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

