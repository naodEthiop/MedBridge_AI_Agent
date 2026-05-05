import { NextResponse } from 'next/server';

import { geoapifyNearbyPlaces } from '@/lib/backend/geoapify';
import { runImageAnalysis, runSymptomTriage } from '@/lib/ai/aiService';
import type { McpToolRequest, NearbyPlace } from '@/lib/backend/types';
import { getRepositories, repositoryPrincipalFromAuthenticatedUser } from '@/lib/server/repositories';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { getAuthenticatedUser, UnauthorizedError } from '@/lib/server/auth';
import { createDBGateway } from '@/lib/db/dbGateway';

function base64ToBlob(base64: string, mimeType: string): Blob {
  const bytes = Buffer.from(base64, 'base64');
  return new Blob([bytes], { type: mimeType });
}

export async function POST(request: Request) {
  try {
    // Guard: Required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[MCP ERROR] Missing Supabase configuration");
      throw new Error("Supabase environment not configured");
    }

    let body: McpToolRequest;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    const tenantId = user.tenantId || "demo-tenant";
    
    // Ensure principal uses the extracted tenantId
    const principal = repositoryPrincipalFromAuthenticatedUser(user);
    const repos = getRepositories(principal);

    // AI Timeout (10s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      switch (body.tool) {
        case 'symptom_checker': {
          console.log('Using AI tool: symptom_checker');
          try {
            const triage = await Promise.race([
              runSymptomTriage({
                message: body.input.message,
                bodyPart: body.input.bodyPart ?? null,
              }),
              new Promise((_, reject) => setTimeout(() => reject(new Error("AI Timeout")), 10000))
            ]) as any;
            
            if ('error' in triage) {
              return NextResponse.json({ ok: false, tool: body.tool, error: triage.error }, { status: 200 });
            }

            return NextResponse.json({
              ok: true,
              tool: body.tool,
              result: {
                possibleConditions: triage.advice || [],
                urgency: triage.riskLevel,
                nextSteps: triage.advice || [],
                redFlags: triage.riskLevel === 'high' ? ['Urgent medical attention may be required'] : [],
                message: triage.message,
                followUpQuestions: triage.followUp || [],
              },
            });
          } catch (err) {
            console.error("[MCP ERROR] Triage tool failed", err);
            return NextResponse.json({ 
              ok: false, 
              tool: body.tool, 
              error: "MedBridge AI is temporarily unavailable",
              message: "I'm having trouble analyzing your symptoms right now. Please try again in a moment."
            }, { status: 200 });
          }
        }

        case 'analyze_image': {
          console.log('Using AI tool: analyze_image');
          try {
            const image = base64ToBlob(body.input.base64Data, body.input.mimeType);
            const analysis = await Promise.race([
              runImageAnalysis(image),
              new Promise((_, reject) => setTimeout(() => reject(new Error("AI Timeout")), 10000))
            ]) as any;
            return NextResponse.json({ ok: true, tool: body.tool, result: analysis });
          } catch (err) {
            console.error("[MCP ERROR] Image analysis failed", err);
            return NextResponse.json({ 
              ok: false, 
              tool: body.tool, 
              error: "Image analysis service failed",
              message: "We couldn't process the image. Please try again."
            }, { status: 200 });
          }
        }

        case 'get_nearby_hospitals': {
          console.log('Using GEO tool: get_nearby_hospitals');
          return NextResponse.json({ 
            ok: false, 
            tool: body.tool, 
            error: "Please use /api/nearby for location services" 
          }, { status: 200 });
        }

        case 'get_patient_data': {
          if (user.role !== 'doctor') {
            return NextResponse.json({ ok: false, tool: body.tool, error: 'Access denied' }, { status: 200 });
          }

          try {
            const dbGateway = createDBGateway({ tenantId, userId: user.id, role: user.role });
            const patients = await dbGateway.query('patients', { match: { id: body.input.patientId }, limit: 1 });
            const patient = patients[0];
            
            if (!patient) {
              return NextResponse.json({ ok: false, tool: body.tool, error: 'Patient not found' }, { status: 200 });
            }
            const appointments = await dbGateway.query('appointments', { match: { patient_id: patient.id } });
            return NextResponse.json({ ok: true, tool: body.tool, result: { patient, appointments } });
          } catch (err) {
            console.error("[MCP ERROR] Patient data fetch failed", err);
            return NextResponse.json({ ok: false, tool: body.tool, error: "Database error" }, { status: 200 });
          }
        }

        case 'save_doctor_notes': {
          if (user.role !== 'doctor') {
            return NextResponse.json({ ok: false, tool: body.tool, error: 'Access denied' }, { status: 200 });
          }

          try {
            const dbGateway = createDBGateway({ tenantId, userId: user.id, role: user.role });
            const result = await dbGateway.insert('doctor_notes', {
              patient_id: body.input.patientId,
              doctor_id: user.id,
              subjective: body.input.subjective,
              bp: body.input.bp,
              heart_rate: body.input.heartRate,
              assessment: body.input.assessment,
              status: body.input.status,
            });
            return NextResponse.json({ ok: true, tool: body.tool, result: { note: result } });
          } catch (err) {
            console.error("[MCP ERROR] Save notes failed", err);
            return NextResponse.json({ ok: false, tool: body.tool, error: "Save failed" }, { status: 200 });
          }
        }

        default:
          return NextResponse.json({ ok: false, error: 'Unknown tool' }, { status: 400 });
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error("[MCP ERROR] Global catch", error);
    const msg = error instanceof Error ? error.message : 'Internal MCP error';
    return NextResponse.json({ 
      ok: false, 
      error: "MCP failed", 
      message: "The MedBridge AI Assistant is temporarily unavailable." 
    }, { status: 500 });
  }
}

