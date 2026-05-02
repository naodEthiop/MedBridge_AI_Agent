import { NextResponse } from "next/server";

import { geoapifyNearbyPlaces } from "@/lib/backend/geoapify";
import { geminiAnalyzeImage, geminiSymptomTriage } from "@/lib/backend/gemini";
import type { McpToolRequest, NearbyPlace } from "@/lib/backend/types";
import { getRepositories } from "@/lib/server/repositories";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

export async function POST(req: Request) {
  const body = (await req.json()) as McpToolRequest;

  try {
    switch (body.tool) {
      case "symptom_checker": {
        const triage = await geminiSymptomTriage({
          message: body.input.message,
          bodyPart: body.input.bodyPart ?? null,
        });
        return NextResponse.json({
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
      case "analyze_image": {
        const analysis = await geminiAnalyzeImage(body.input);
        return NextResponse.json({ tool: body.tool, result: analysis });
      }
      case "get_nearby_hospitals": {
        const catMap: Record<"hospital" | "clinic" | "pharmacy", string[]> = {
          hospital: ["healthcare.hospital"],
          clinic: ["healthcare.clinic", "healthcare.doctor"],
          pharmacy: ["healthcare.pharmacy"],
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
          tool: body.tool,
          result: {
            places: places as NearbyPlace[],
            location: { lat: body.input.lat, lng: body.input.lng },
          },
        });
      }
      case "get_patient_data": {
        const repos = getRepositories();
        const patient = await repos.patients.getPatient(body.input.patientId);
        if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });
        const appointments = await repos.appointments.listAppointmentsForPatient(body.input.patientId);
        return NextResponse.json({ tool: body.tool, result: { patient, appointments } });
      }
      case "save_doctor_notes": {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
          .from("doctor_notes")
          .insert({
            patient_id: body.input.patientId,
            doctor_id: body.input.doctorId,
            subjective: body.input.subjective,
            bp: body.input.bp,
            heart_rate: body.input.heartRate,
            assessment: body.input.assessment,
            status: body.input.status,
          })
          .select("*")
          .maybeSingle();
        if (error) throw error;
        return NextResponse.json({ tool: body.tool, result: { note: data } });
      }
      default:
        return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Tool execution failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

