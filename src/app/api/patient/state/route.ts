import { NextResponse } from 'next/server';

import { getAuthenticatedUser, UnauthorizedError } from '@/lib/server/auth';
import { getRepositories, repositoryPrincipalFromAuthenticatedUser } from '@/lib/server/repositories';
import { computePatientState } from '@/lib/ai/aiService';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const requestedPatientId = searchParams.get('patientId');

    const repos = getRepositories(repositoryPrincipalFromAuthenticatedUser(user));
    const patientId = user.role === 'patient' ? user.id : requestedPatientId;
    if (!patientId) {
      return NextResponse.json({ ok: false, error: 'patientId is required for doctors' }, { status: 400 });
    }

    const patient = await repos.patients.getPatient(patientId);
    if (!patient) {
      return NextResponse.json({ ok: false, error: 'Patient not found' }, { status: 404 });
    }

    if (user.role === 'patient' && user.id !== patient.id) {
      return NextResponse.json({ ok: false, error: 'Patients may only view their own state' }, { status: 403 });
    }

    if (user.role === 'doctor' && patient.primaryDoctorId !== user.id) {
      return NextResponse.json({ ok: false, error: 'Doctor may only view assigned patient state' }, { status: 403 });
    }

    const timeline = await repos.timeline.listTimelineForPatient(patient.id);
    const appointments = await repos.appointments.listAppointmentsForPatient(patient.id);

    const lastAiAssessment = timeline.find((event) => event.source === 'ai')?.description;
    const currentRiskLevel = timeline.find((event) => event.eventType === 'patient:risk_updated')?.severity ?? 'low';
    const nextAppointment = appointments.find((appt) => appt.status === 'scheduled');

    const state = await computePatientState({
      patientId: patient.id,
      patientName: patient.fullName,
      assignedDoctor: patient.primaryDoctorId
        ? { id: patient.primaryDoctorId, fullName: '', specialty: '' }
        : undefined,
      activeConditions: patient.conditions ?? [],
      lastAiAssessment: lastAiAssessment ?? undefined,
      nextAppointmentPriority: nextAppointment?.urgency,
      currentRiskLevel: currentRiskLevel as 'low' | 'medium' | 'high' | 'critical',
      urgentEventPresent: timeline.some((event) => event.severity === 'critical'),
      timelineSummary: timeline.slice(0, 5).map((event) => `${event.title}: ${event.description}`),
    });

    return NextResponse.json({ ok: true, state });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Patient state evaluation failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
