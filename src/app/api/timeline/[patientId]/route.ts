import { NextResponse } from 'next/server';

import { getAuthenticatedUser, UnauthorizedError } from '@/lib/server/auth';
import { getRepositories } from '@/lib/server/repositories';

export async function GET(request: Request, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    const { patientId } = await params;
    const repos = getRepositories();
    const patient = await repos.patients.getPatient(patientId);
    if (!patient) {
      return NextResponse.json({ ok: false, error: 'Patient not found' }, { status: 404 });
    }

    if (user.role === 'patient' && user.id !== patient.id) {
      return NextResponse.json({ ok: false, error: 'Patients may only view their own timeline' }, { status: 403 });
    }

    if (user.role === 'doctor' && patient.primaryDoctorId !== user.id) {
      return NextResponse.json({ ok: false, error: 'Doctors may only view assigned patient timelines' }, { status: 403 });
    }

    const timeline = await repos.timeline.listTimelineForPatient(patient.id);
    return NextResponse.json({ ok: true, data: { timeline } });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed to load timeline';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
