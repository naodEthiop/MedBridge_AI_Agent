import { NextResponse } from "next/server";
import { runImageAnalysis } from "@/lib/ai/aiService";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Prescription image is required." }, { status: 400 });
    }

    const analysis = await runImageAnalysis(file);

    if (!analysis.success) {
      return NextResponse.json({ error: analysis.error, analysis: null }, { status: 502 });
    }

    return NextResponse.json({
      analysis: {
        detected: analysis.findings.length > 0,
        confidence: analysis.confidence >= 0.75 ? "high" : analysis.confidence >= 0.55 ? "likely" : "possible",
        medicine: analysis.possibleConditions[0] ?? analysis.findings[0],
        dosage: undefined,
        timing: undefined,
        summary: analysis.recommendation || analysis.findings.join(", "),
        usage: "",
        warnings: [],
      },
      isPrescription: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Analysis failed";
    return NextResponse.json({ error: msg, analysis: null }, { status: 502 });
  }
}

