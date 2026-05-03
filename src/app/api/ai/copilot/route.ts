import { NextResponse } from 'next/server';

import { getAuthenticatedUser, UnauthorizedError } from '@/lib/server/auth';
import { getRepositories } from '@/lib/server/repositories';
import { emitEvent } from '@/lib/server/events';
import { generateDoctorCopilotReport } from '@/lib/ai/aiService';

export async function POST(request: Request) {
  try {
    // DOCTOR COPILOT FLOW:
    // API route -> aiService.generateDoctorCopilotReport -> repositories.timeline.createTimelineEvent
    // -> emitEvent("doctor:note_added") -> response.
    const user = await getAuthenticatedUser(request);
    if (user.role !== 'doctor') {
      return NextResponse.json({ ok: false, error: 'Only doctors may access the copilot report' }, { status: 403 });
    }

    const body = (await request.json()) as { patientId: string };
    if (!body.patientId) {
      return NextResponse.json({ ok: false, error: 'patientId is required' }, { status: 400 });
    }

    const repos = getRepositories();
    const patient = await repos.patients.getPatient(body.patientId);
    if (!patient) {
      return NextResponse.json({ ok: false, error: 'Patient not found' }, { status: 404 });
    }
    if (patient.primaryDoctorId !== user.id) {
      return NextResponse.json({ ok: false, error: 'Doctor may only access reports for assigned patients' }, { status: 403 });
    }

    const timeline = await repos.timeline.listTimelineForPatient(patient.id);
    const labs = await repos.labs.listLabsForPatient(patient.id);
    const appointments = await repos.appointments.listAppointmentsForPatient(patient.id);

    const timelineSummary = timeline.map((event) => `${event.title}: ${event.description}`).join('\n');
    const labsSummary = labs.map((lab) => `${lab.testName}: ${lab.result}${lab.normalRange ? ` (normal range: ${lab.normalRange})` : ''}`).join('\n');
    const appointmentsSummary = appointments
      .slice(0, 10)
      .map((appt) => `${appt.status} appointment with doctor ${appt.doctorId} on ${appt.startTime} (urgency: ${appt.urgency ?? 'medium'})`)
      .join('\n');

    const patientProfile = `Patient: ${patient.fullName}; DOB: ${patient.dateOfBirth}; sex: ${patient.sex}; conditions: ${patient.conditions?.join(', ') || 'none'}; allergies: ${patient.allergies?.join(', ') || 'none'}; contact: ${patient.phone ?? 'unknown'}`;

    const report = await generateDoctorCopilotReport({
      patientId: patient.id,
      patientProfile,
      timelineSummary: timelineSummary || 'No timeline available.',
      labsSummary: labsSummary || 'No lab history available.',
      appointmentsSummary: appointmentsSummary || 'No appointment history available.',
    });

    if ('error' in report) {
      return NextResponse.json({ ok: false, error: report.error }, { status: 503 });
    }

    await repos.timeline.createTimelineEvent({
      patientId: patient.id,
      eventType: 'doctor:copilot_generated',
      title: 'Doctor copilot report generated',
      description: report.takeaway,
      severity: 'medium',
      source: 'ai',
      metadata: {
        abnormalities: report.abnormalities,
        differentialDiagnoses: report.differentialDiagnoses,
      },
    });

    emitEvent('doctor:note_added', {
      patientId: patient.id,
      doctorId: user.id,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, data: { report } });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Doctor copilot generation failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
