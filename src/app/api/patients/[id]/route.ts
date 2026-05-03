import { NextResponse } from 'next/server';

import { getAuthenticatedUser, UnauthorizedError } from '@/lib/server/auth';
import { getRepositories } from '@/lib/server/repositories';

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = await ctx.params;
    const repos = getRepositories();

    if (user.role === 'doctor') {
      const patient = await repos.patients.getPatient(id);
      if (!patient) {
        return NextResponse.json({ ok: false, error: 'Patient not found' }, { status: 404 });
      }
      const appointments = await repos.appointments.listAppointmentsForPatient(patient.id);
      return NextResponse.json({ ok: true, data: { patient, appointments } });
    }

    if (user.role === 'patient') {
      if (id !== user.id) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
      }
      const patient = await repos.patients.getPatient(user.id);
      if (!patient) {
        return NextResponse.json({ ok: false, error: 'Patient record not found' }, { status: 404 });
      }
      const appointments = await repos.appointments.listAppointmentsForPatient(patient.id);
      return NextResponse.json({ ok: true, data: { patient, appointments } });
    }

    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Unable to fetch patient details';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

