import { NextResponse } from "next/server";

import { processUserInput } from "@/lib/ai/agent";
import { analyzeImageFull } from "@/lib/ai/cloudflare";
import { env } from "@/lib/env";
import { transcribeAudioBlob } from "@/lib/server/speech";
import { createCase } from "@/lib/backend/case-service";
import { getAccessTokenFromRequest } from "@/lib/server/authUser";

function parseLatLng(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const num = Number(value.trim());
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function parseLocation(source: Record<string, unknown>): { lat: number; lng: number } | null {
  const lat = parseLatLng(source.lat ?? source.latitude);
  const lng = parseLatLng(source.lng ?? source.lon ?? source.longitude);
  if (lat === null || lng === null) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

async function appendNearbyHospitalsIfUrgent(req: Request, medix: Record<string, unknown>, location: { lat: number; lng: number } | null) {
  if (medix.urgency !== "urgent" || !location) {
    return;
  }

  try {
    const url = new URL(`/api/geo/nearby-hospitals?lat=${encodeURIComponent(String(location.lat))}&lng=${encodeURIComponent(
      String(location.lng),
    )}`, req.url);
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("Nearby hospitals lookup failed", await res.text());
      return;
    }
    const payload = (await res.json()) as { success?: boolean; hospitals?: unknown[]; error?: string };
    if (payload.success && Array.isArray(payload.hospitals)) {
      medix.nearbyHospitals = payload.hospitals;
    }
  } catch (error) {
    console.error("Failed to fetch nearby hospitals", error);
  }
}

function safeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function safeStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : undefined;
}

export async function POST(req: Request) {
  try {
    if (!env.GEMINI_API_KEY?.trim()) {
      return NextResponse.json({ ok: false, error: "Medix AI requires GEMINI_API_KEY." }, { status: 503 });
    }

    const contentType = req.headers.get("content-type") ?? "";
    let message: string | undefined;
    let bodyPart: string | null | undefined;
    let transcript: string | undefined;
    let symptoms: string[] | undefined;
    let skipTriage = false;
    let location: { lat: number; lng: number } | null = null;
    const imageFindings: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      message = safeString(form.get("message"));
      const rawBodyPart = form.get("bodyPart");
      bodyPart = typeof rawBodyPart === "string" && rawBodyPart.trim() ? rawBodyPart.trim() : null;
      location = parseLocation({
        lat: form.get("lat"),
        lng: form.get("lng"),
        lon: form.get("lon"),
        latitude: form.get("latitude"),
        longitude: form.get("longitude"),
      });

      skipTriage = String(form.get("skipTriage") ?? "false") === "true";
      const audio = form.get("audio");
      if (audio instanceof Blob && audio.size > 0) {
        const filename = safeString(form.get("filename")) ?? "speech.webm";
        const transcription = await transcribeAudioBlob(audio, filename);
        if ("error" in transcription) {
          console.error("Audio transcription failed", transcription.error);
        } else {
          transcript = transcription.text;
        }
      }

      const image = form.get("image");
      if (image instanceof Blob && image.size > 0 && image.type.startsWith("image/")) {
        const r = await analyzeImageFull(image);
        if (r.success) {
          imageFindings.push(...r.findings, ...r.possibleConditions.map((c) => `Visual (non-diagnostic): ${c}`));
          if (r.recommendation) imageFindings.push(`Image recommendation: ${r.recommendation}`);
        } else {
          console.error("Image analysis failed", r.error);
        }
      }
    } else {
      const body = (await req.json()) as Record<string, unknown>;
      message = safeString(body.message);
      bodyPart = typeof body.bodyPart === "string" ? safeString(body.bodyPart) ?? null : body.bodyPart === null ? null : undefined;
      symptoms = safeStringArray(body.symptoms);
      skipTriage = body.skipTriage === true;
      transcript = safeString(body.transcript);
      location = parseLocation(body);
      const imageArray = safeStringArray(body.imageFindings);
      if (imageArray) {
        imageFindings.push(...imageArray);
      }
    }

    const medix = await processUserInput({
      message,
      symptoms,
      bodyPart,
      transcript,
      imageFindings: imageFindings.length ? imageFindings : undefined,
      skipTriage,
    });

    await appendNearbyHospitalsIfUrgent(req, medix as Record<string, unknown>, location);

    const token = getAccessTokenFromRequest(req);
    if (token && typeof message === "string" && message.trim()) {
      void createCase(
        {
          symptoms: message.trim(),
          urgency: medix.urgency === "urgent" ? "urgent" : "medium",
          redFlags: medix.redFlags,
          doctorSummary: medix.message,
        },
        token,
      ).catch((error) => console.error("Auto-persist case failed", error));
    }

    return NextResponse.json({ ok: true, medix });
  } catch (error) {
    console.error("/api/ai/process failed", error);
    return NextResponse.json({ ok: false, error: "Medix AI could not process this request." }, { status: 500 });
  }
}
