import { NextResponse } from "next/server";

import { analyzeImageFull } from "@/lib/ai/cloudflare";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("image");

    if (!file || typeof file === "string" || !(file instanceof Blob)) {
      return NextResponse.json({ ok: false, error: "Missing image file (use form field name: image)." }, { status: 400 });
    }

    const result = await analyzeImageFull(file);
    if (!result.success) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 503 });
    }

    const { success: _s, ...data } = result;
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image analysis failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
