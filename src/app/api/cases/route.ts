import { NextResponse } from "next/server";

import { createCase, listCases } from "@/lib/backend/case-service";
import { getAccessTokenFromRequest } from "@/lib/server/authUser";

export async function GET(req: Request) {
  const token = getAccessTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limitParam = Number(url.searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(100, limitParam)) : 50;

  const cases = await listCases(limit, token);
  return NextResponse.json({ ok: true, cases });
}

export async function POST(req: Request) {
  try {
    const token = getAccessTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      symptoms?: string;
      urgency?: "medium" | "urgent";
      redFlags?: string[];
      doctorSummary?: string;
      patientName?: string;
      nearestHospital?: {
        name: string;
        distanceKm: number;
        etaMinutes: number;
        phone: string;
      };
    };

    if (!body.symptoms || !body.doctorSummary) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: symptoms, doctorSummary" },
        { status: 400 },
      );
    }

    const created = await createCase(
      {
        symptoms: body.symptoms,
        urgency: body.urgency === "urgent" ? "urgent" : "medium",
        redFlags: body.redFlags ?? [],
        doctorSummary: body.doctorSummary,
        patientName: body.patientName,
        nearestHospital: body.nearestHospital,
      },
      token,
    );

    return NextResponse.json({ ok: true, case: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create case";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
