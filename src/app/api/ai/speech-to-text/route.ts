import { NextResponse } from "next/server";

import { transcribeAudioBlob } from "@/lib/server/speech";

/**
 * POST multipart/form-data with field `audio` (e.g. webm from MediaRecorder).
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const audio = form.get("audio");
    if (!audio || typeof audio === "string" || !(audio instanceof Blob)) {
      return NextResponse.json({ success: false, error: "Missing audio blob (form field: audio)." }, { status: 400 });
    }

    const filename = typeof form.get("filename") === "string" ? String(form.get("filename")) : "speech.webm";
    const out = await transcribeAudioBlob(audio, filename);
    if ("error" in out) {
      return NextResponse.json({ success: false, error: out.error }, { status: 503 });
    }
    return NextResponse.json({ success: true, text: out.text });
  } catch {
    return NextResponse.json({ success: false, error: "Speech-to-text failed." }, { status: 500 });
  }
}
