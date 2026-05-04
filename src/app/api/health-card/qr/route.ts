import { NextResponse } from "next/server";
import { requireSessionPrincipal } from "@/lib/server/sessionPrincipal";

const QR_TOKEN_SECRET = process.env.QR_TOKEN_SECRET || "default-dev-secret-change-in-production";
const TOKEN_EXPIRES_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface QRPayload {
  v: number;
  app: string;
  patientId: string;
  userId: string;
  issued: string;
  expires: string;
  sig: string;
}

function computeSignature(payload: Omit<QRPayload, "sig">): string {
  const msg = `${payload.v}:${payload.app}:${payload.patientId}:${payload.userId}:${payload.issued}:${payload.expires}`;
  const hmac = require("crypto").createHmac("sha256", QR_TOKEN_SECRET);
  hmac.update(msg);
  return hmac.digest("hex");
}

export async function POST(request: Request) {
  try {
    const principal = await requireSessionPrincipal(request);
    const { patientId } = (await request.json()) as { patientId?: string };

    if (!patientId) {
      return NextResponse.json(
        { ok: false, error: "Patient ID required" },
        { status: 400 },
      );
    }

    const now = new Date();
    const expires = new Date(now.getTime() + TOKEN_EXPIRES_MS);

    const payload: Omit<QRPayload, "sig"> = {
      v: 1,
      app: "medbridge",
      patientId,
      userId: principal.userId,
      issued: now.toISOString(),
      expires: expires.toISOString(),
    };

    const sig = computeSignature(payload);
    const qrPayload: QRPayload = { ...payload, sig };

    const qrData = Buffer.from(JSON.stringify(qrPayload)).toString("base64");
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`medbridge://verify/${qrData}`)}`;

    return NextResponse.json({
      ok: true,
      qrPayload,
      qrImageUrl,
    });
  } catch (error) {
    console.error("[health-card/qr]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to generate QR code" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const principal = await requireSessionPrincipal(request);
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId") ?? principal.userId;

    const now = new Date();
    const expires = new Date(now.getTime() + TOKEN_EXPIRES_MS);

    const payload: Omit<QRPayload, "sig"> = {
      v: 1,
      app: "medbridge",
      patientId,
      userId: principal.userId,
      issued: now.toISOString(),
      expires: expires.toISOString(),
    };

    const sig = computeSignature(payload);
    const qrPayload: QRPayload = { ...payload, sig };

    const qrData = Buffer.from(JSON.stringify(qrPayload)).toString("base64");
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`medbridge://verify/${qrData}`)}`;

    return NextResponse.json({
      ok: true,
      qrPayload,
      qrImageUrl,
    });
  } catch (error) {
    console.error("[health-card/qr GET]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to generate QR code" },
      { status: 500 },
    );
  }
}
