import { NextResponse } from 'next/server';

import { getAuthenticatedUser, UnauthorizedError } from '@/lib/server/auth';
import { getRepositories } from '@/lib/server/repositories';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    const repos = getRepositories();
    const patient = await repos.patients.getPatient(user.id);
    const doctor = patient ? null : await repos.doctors.getDoctor(user.id);

    return NextResponse.json({
      ok: true,
      data: {
        profile: {
          id: user.id,
          email: user.email,
          role: user.role,
          patient,
          doctor,
        },
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed to load profile';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
