import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveSessionPrincipal } from '@/lib/server/sessionPrincipal';
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
    const user = await resolveSessionPrincipal(request);

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.tenantId || "demo-tenant";
    const repos = getRepositories({ tenantId, userId: user.userId, role: user.role as "patient" | "doctor" | "admin" });

    if (user.role === 'patient') {
      const patient = await repos.patients.getPatient(user.userId);
      if (!patient) {
        return NextResponse.json({ ok: false, error: 'Patient not found' }, { status: 404 });
      }
      const appointments = await repos.appointments.listAppointmentsForPatient(patient.id);
      return NextResponse.json({ ok: true, data: { appointments } });
    }

    if (user.role === 'doctor') {
      const doctor = await repos.doctors.getDoctor(user.userId);
      if (!doctor) {
        return NextResponse.json({ ok: false, error: 'Doctor not found' }, { status: 404 });
      }
      const appointments = await repos.appointments.listAppointmentsForDoctor(doctor.id);
      return NextResponse.json({ ok: true, data: { appointments } });
    }

    return NextResponse.json({ ok: false, error: 'Invalid role' }, { status: 403 });
  } catch (error) {
    console.error("API ERROR [appointments GET]:", error);
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await resolveSessionPrincipal(request);

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'patient') {
      return NextResponse.json({ ok: false, error: 'Only patients can create appointments' }, { status: 403 });
    }

    const tenantId = user.tenantId || "demo-tenant";

    const json = await request.json();
    const parsed = createAppointmentBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const repos = getRepositories({ tenantId, userId: user.userId, role: "patient" });
    const patient = await repos.patients.getPatient(user.userId);
    if (!patient) {
      return NextResponse.json({ ok: false, error: "Patient profile not found" }, { status: 404 });
    }

    const doctor = await repos.doctors.getDoctor(parsed.data.doctorId);
    if (!doctor) {
      return NextResponse.json({ ok: false, error: "Doctor not found" }, { status: 404 });
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
    console.error("API ERROR [appointments POST]:", error);
    return NextResponse.json({ ok: false, error: "Failed to create appointment" }, { status: 500 });
  }
}
