import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createSessionCookie,
  getSessionSecret,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session-core";
import type { SessionUser } from "@/lib/auth/types";
import { getDemoUserStore, hashDemoPassword, normalizeEmail } from "@/lib/server/demo-user-store";

const patientSchema = z.object({
  fullName: z.string().min(2),
  age: z.coerce.number().int().min(1).max(130),
  sex: z.enum(["female", "male", "other"]),
  heightCm: z.coerce.number().min(50).max(280),
  weightKg: z.coerce.number().min(15).max(400),
  bloodType: z.string().min(1),
});

const doctorSchema = z.object({
  fullName: z.string().min(2),
  specialty: z.string().min(1),
  experienceYears: z.coerce.number().int().min(0).max(80),
  clinicName: z.string().min(1),
});

const bodySchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("patient"),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    patient: patientSchema,
  }),
  z.object({
    role: z.literal("doctor"),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    doctor: doctorSchema,
  }),
]);

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid registration data", details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    if (data.password !== data.confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    const email = normalizeEmail(data.email);
    const store = getDemoUserStore();
    if (store.has(email)) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const pepper = getSessionSecret();
    const passwordHash = hashDemoPassword(data.password, pepper);

    let user: SessionUser;
    if (data.role === "patient") {
      const patientProfile = data.patient;
      store.set(email, {
        passwordHash,
        role: "patient",
        patientProfile,
      });
      user = { email, role: "patient", patientProfile };
    } else {
      const doctorProfile = data.doctor;
      store.set(email, {
        passwordHash,
        role: "doctor",
        doctorProfile,
      });
      user = { email, role: "doctor", doctorProfile };
    }

    const token = await createSessionCookie(user);
    const jar = await cookies();
    jar.set(SESSION_COOKIE, token, sessionCookieOptions());

    return NextResponse.json({ ok: true, user });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Registration failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
