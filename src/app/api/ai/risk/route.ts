import { NextResponse } from 'next/server';

import { getAuthenticatedUser, UnauthorizedError } from '@/lib/server/auth';
import { getRepositories } from '@/lib/server/repositories';
import { emitEvent } from '@/lib/server/events';
import { runRiskPrediction } from '@/lib/ai/aiService';
import { triggerEmergencyForPatient } from '@/lib/server/emergency';

export async function POST(request: Request) {
  try {
    // RISK PREDICTION FLOW:
    // API route -> aiService.runRiskPrediction -> repositories.timeline.createTimelineEvent
    // -> emitEvent("patient:risk_updated") -> response.
    // Persisted risk timeline event must be written before event emission.
    const user = await getAuthenticatedUser(request);
    const body = (await request.json()) as {
      patientId: string;
      symptomsHistory?: string;
      demographics?: string;
      autoTrigger?: boolean;
      location?: { lat: number; lng: number; address?: string };
    };

    if (!body.patientId) {
      return NextResponse.json({ ok: false, error: 'patientId is required' }, { status: 400 });
    }

    const repos = getRepositories();
    const patient = await repos.patients.getPatient(body.patientId);
    if (!patient) {
      return NextResponse.json({ ok: false, error: 'Patient not found' }, { status: 404 });
    }

    if (user.role === 'patient' && user.id !== patient.id) {
      return NextResponse.json({ ok: false, error: 'Patients may only assess their own risk' }, { status: 403 });
    }

    if (user.role === 'doctor' && patient.primaryDoctorId !== user.id) {
      return NextResponse.json({ ok: false, error: 'Doctors may only assess assigned patients' }, { status: 403 });
    }

    const timeline = await repos.timeline.listTimelineForPatient(patient.id);
    const labs = await repos.labs.listLabsForPatient(patient.id);
    const appointments = await repos.appointments.listAppointmentsForPatient(patient.id);

    const timelineSummary = timeline
      .slice(0, 10)
      .map((event) => `${event.title}: ${event.description}`)
      .join(' \n');
    const labsSummary = labs
      .map((lab) => `${lab.testName}: ${lab.result}${lab.normalRange ? ` (normal: ${lab.normalRange})` : ''}`)
      .join(' \n');
    const demographics =
      body.demographics ||
      `DOB: ${patient.dateOfBirth}; sex: ${patient.sex}; conditions: ${patient.conditions?.join(', ') || 'none'}; allergies: ${patient.allergies?.join(', ') || 'none'}`;
    const symptomsHistory =
      body.symptomsHistory ||
      timeline
        .filter((event) => event.source === 'ai' || event.source === 'doctor' || event.eventType.includes('symptom'))
        .slice(0, 5)
        .map((event) => event.description)
        .join(' \n');

    const prediction = await runRiskPrediction({
      patientId: patient.id,
      demographics,
      symptomsHistory: symptomsHistory || 'No recent symptom history available.',
      timelineSummary: timelineSummary || 'No timeline history available.',
      labsSummary: labsSummary || 'No lab history available.',
    });

    if ('error' in prediction) {
      return NextResponse.json({ ok: false, error: prediction.error }, { status: 503 });
    }

    await repos.timeline.createTimelineEvent({
      patientId: patient.id,
      eventType: 'patient:risk_updated',
      title: `Risk prediction: ${prediction.risk_level}`,
      description: prediction.rationale,
      severity: prediction.risk_level === 'critical' ? 'critical' : prediction.risk_level === 'high' ? 'high' : prediction.risk_level === 'medium' ? 'medium' : 'low',
      source: 'ai',
      metadata: {
        riskScore: prediction.risk_score,
        predictedConditions: prediction.predicted_conditions,
        recommendedActions: prediction.recommended_actions,
        escalationRequired: prediction.escalation_required,
      },
    });

    emitEvent('patient:risk_updated', {
      patientId: patient.id,
      riskLevel: prediction.risk_level,
      escalationRequired: prediction.escalation_required,
    });

    let emergencyResult = null;
    if (prediction.escalation_required && body.autoTrigger) {
      emergencyResult = await triggerEmergencyForPatient({
        patientId: patient.id,
        riskLevel: prediction.risk_level,
        symptoms: body.symptomsHistory ? [body.symptomsHistory] : [],
        aiSummary: prediction.rationale,
        location: body.location,
        initiatedByUserId: user.id,
        senderRole: user.role,
      });
    }

    return NextResponse.json({ ok: true, data: { prediction, emergencyResult, timeline, labs, appointments } });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Risk prediction failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
