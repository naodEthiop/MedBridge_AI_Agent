import { NextResponse } from "next/server";

import { geminiAnalyzeImage } from "@/lib/backend/gemini";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Prescription image is required." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");
    const analysis = await geminiAnalyzeImage({
      kind: "prescription",
      mimeType: file.type || "image/jpeg",
      base64Data,
      hintText: `Filename: ${file.name}`,
    });

    return NextResponse.json({
      analysis: {
        detected: !!analysis.medicationName,
        confidence: analysis.confidence >= 0.75 ? "high" : analysis.confidence >= 0.55 ? "likely" : "possible",
        medicine: analysis.medicationName ?? undefined,
        dosage: undefined,
        timing: undefined,
        summary: analysis.summary,
        usage: analysis.usage,
        warnings: analysis.warnings,
      },
      isPrescription: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Analysis failed";
    return NextResponse.json({ error: msg, analysis: null }, { status: 502 });
  }
}

