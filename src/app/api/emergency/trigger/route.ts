import { NextResponse } from 'next/server';

import { getAuthenticatedUser, UnauthorizedError } from '@/lib/server/auth';
import { getRepositories } from '@/lib/server/repositories';
import { triggerEmergencyForPatient } from '@/lib/server/emergency';

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = (await request.json()) as {
      patientId: string;
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
      symptoms: string[];
      aiSummary: string;
      location?: { lat: number; lng: number; address?: string };
    };

    if (!body.patientId || !body.riskLevel || !Array.isArray(body.symptoms) || !body.aiSummary) {
      return NextResponse.json({ ok: false, error: 'Invalid emergency payload' }, { status: 400 });
    }

    const repos = getRepositories();
    const patient = await repos.patients.getPatient(body.patientId);
    if (!patient) {
      return NextResponse.json({ ok: false, error: 'Patient not found' }, { status: 404 });
    }

    if (user.role === 'patient' && user.id !== body.patientId) {
      return NextResponse.json({ ok: false, error: 'Patients may only trigger emergencies for themselves' }, { status: 403 });
    }

    if (user.role === 'doctor' && patient.primaryDoctorId !== user.id) {
      return NextResponse.json({ ok: false, error: 'Doctor may only trigger emergencies for assigned patients' }, { status: 403 });
    }

    const result = await triggerEmergencyForPatient({
      patientId: body.patientId,
      riskLevel: body.riskLevel,
      symptoms: body.symptoms,
      aiSummary: body.aiSummary,
      location: body.location,
      initiatedByUserId: user.id,
      senderRole: user.role,
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Emergency trigger failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
