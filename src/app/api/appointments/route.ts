import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAuthenticatedUser, UnauthorizedError } from '@/lib/server/auth';
import { getRepositories } from '@/lib/server/repositories';

const createAppointmentBodySchema = z.object({
  patientId: z.string().optional(),
  doctorId: z.string().min(1),
  healthCenterId: z.string().min(1),
  scheduledAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Invalid scheduledAt date',
  }),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional().default('scheduled'),
  reason: z.string().optional(),
  location: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    const repos = getRepositories();

    if (user.role === 'patient') {
      const patient = await repos.patients.getPatient(user.id);
      if (!patient) {
        return NextResponse.json({ ok: false, error: 'Patient record not found' }, { status: 404 });
      }
      const appointments = await repos.appointments.listAppointmentsForPatient(patient.id);
      return NextResponse.json({ ok: true, data: { appointments, source: 'supabase' } });
    }

    if (user.role === 'doctor') {
      const doctor = await repos.doctors.getDoctor(user.id);
      if (!doctor) {
        return NextResponse.json({ ok: false, error: 'Doctor record not found' }, { status: 404 });
      }
      const appointments = await repos.appointments.listAppointmentsForDoctor(doctor.id);
      return NextResponse.json({ ok: true, data: { appointments, source: 'supabase' } });
    }

    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Unable to fetch appointments';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (user.role !== 'patient') {
      return NextResponse.json({ ok: false, error: 'Only patients may book appointments' }, { status: 403 });
    }

    const json = await request.json();
    const parsed = createAppointmentBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid appointment payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const repos = getRepositories();
    const patient = await repos.patients.getPatient(user.id);
    if (!patient) {
      return NextResponse.json({ ok: false, error: 'Patient profile not found' }, { status: 404 });
    }

    const doctor = await repos.doctors.getDoctor(parsed.data.doctorId);
    if (!doctor) {
      return NextResponse.json({ ok: false, error: 'Doctor not found' }, { status: 404 });
    }

    const appointment = await repos.appointments.createAppointment({
      patientId: patient.id,
      doctorId: doctor.id,
      healthCenterId: parsed.data.healthCenterId,
      scheduledAt: parsed.data.scheduledAt,
      status: parsed.data.status,
      reason: parsed.data.reason,
      location: parsed.data.location,
    });

    return NextResponse.json({ ok: true, data: { appointment } });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Unable to create appointment';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
