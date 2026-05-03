import { NextResponse } from 'next/server';

import { geoapifyNearbyPlaces } from '@/lib/backend/geoapify';
import { runImageAnalysis, runSymptomTriage } from '@/lib/ai/aiService';
import type { McpToolRequest, NearbyPlace } from '@/lib/backend/types';
import { getRepositories } from '@/lib/server/repositories';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { getAuthenticatedUser, UnauthorizedError } from '@/lib/server/auth';

function base64ToBlob(base64: string, mimeType: string): Blob {
  const bytes = Buffer.from(base64, 'base64');
  return new Blob([bytes], { type: mimeType });
}

export async function POST(request: Request) {
  const body = (await request.json()) as McpToolRequest;

  try {
    const user = await getAuthenticatedUser(request);
    const repos = getRepositories();

    switch (body.tool) {
      case 'symptom_checker': {
        console.log('Using AI tool: symptom_checker');
        const triage = await runSymptomTriage({
          message: body.input.message,
          bodyPart: body.input.bodyPart ?? null,
        });
        if ('error' in triage) {
          return NextResponse.json({ ok: false, tool: body.tool, error: triage.error }, { status: 503 });
        }
        return NextResponse.json({
          ok: true,
          tool: body.tool,
          result: {
            possibleConditions: triage.possibleConditions,
            urgency: triage.urgency,
            nextSteps: triage.nextSteps,
            redFlags: triage.redFlags,
            message: triage.message,
          },
        });
      }
      case 'analyze_image': {
        console.log('Using AI tool: analyze_image');
        const image = base64ToBlob(body.input.base64Data, body.input.mimeType);
        const analysis = await runImageAnalysis(image);
        return NextResponse.json({ ok: true, tool: body.tool, result: analysis });
      }
      case 'get_nearby_hospitals': {
        console.log('Using GEO tool: get_nearby_hospitals');
        const catMap: Record<'hospital' | 'clinic' | 'pharmacy', string[]> = {
          hospital: ['healthcare.hospital'],
          clinic: ['healthcare.clinic', 'healthcare.doctor'],
          pharmacy: ['healthcare.pharmacy'],
        };
        const categories = body.input.categories.flatMap((c) => catMap[c]);
        const places = await geoapifyNearbyPlaces({
          lat: body.input.lat,
          lng: body.input.lng,
          categories,
          radiusMeters: body.input.radiusMeters,
          limit: 25,
        });
        return NextResponse.json({
          ok: true,
          tool: body.tool,
          result: {
            places: places as NearbyPlace[],
            location: { lat: body.input.lat, lng: body.input.lng },
          },
        });
      }
      case 'get_patient_data': {
        if (user.role !== 'doctor') {
          return NextResponse.json({ ok: false, tool: body.tool, error: 'Only doctors may access patient records' }, { status: 403 });
        }

        console.log('Using DB tool: get_patient_data');
        const patient = await repos.patients.getPatient(body.input.patientId);
        if (!patient) {
          return NextResponse.json({ ok: false, tool: body.tool, error: 'Patient not found' }, { status: 404 });
        }
        const appointments = await repos.appointments.listAppointmentsForPatient(patient.id);
        return NextResponse.json({ ok: true, tool: body.tool, result: { patient, appointments } });
      }
      case 'save_doctor_notes': {
        if (user.role !== 'doctor') {
          return NextResponse.json({ ok: false, tool: body.tool, error: 'Only doctors may save notes' }, { status: 403 });
        }

        console.log('Using DB tool: save_doctor_notes');
        const doctor = await repos.doctors.getDoctor(user.id);
        if (!doctor) {
          return NextResponse.json({ ok: false, tool: body.tool, error: 'Doctor record not found' }, { status: 403 });
        }
        if (body.input.doctorId !== doctor.id && body.input.doctorId !== user.id) {
          return NextResponse.json({ ok: false, tool: body.tool, error: 'Doctor mismatch' }, { status: 403 });
        }

        const patient = await repos.patients.getPatient(body.input.patientId);
        if (!patient) {
          return NextResponse.json({ ok: false, tool: body.tool, error: 'Patient not found' }, { status: 404 });
        }

        let supabase = null;
        try {
          supabase = getSupabaseAdmin();
        } catch (error) {
          return NextResponse.json(
            { ok: false, tool: body.tool, error: 'Supabase admin is not configured.' },
            { status: 503 },
          );
        }

        const { data, error } = await supabase
          .from('doctor_notes')
          .insert({
            patient_id: patient.id,
            doctor_id: doctor.id,
            subjective: body.input.subjective,
            bp: body.input.bp,
            heart_rate: body.input.heartRate,
            assessment: body.input.assessment,
            status: body.input.status,
          })
          .select('*')
          .maybeSingle();
        if (error || !data) {
          const message = error?.message ?? 'Doctor note insert failed';
          return NextResponse.json({ ok: false, tool: body.tool, error: message }, { status: 500 });
        }
        return NextResponse.json({ ok: true, tool: body.tool, result: { note: data } });
      }
      default:
        return NextResponse.json({ ok: false, error: 'Unknown tool' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }
    const msg = error instanceof Error ? error.message : 'Tool execution failed';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

