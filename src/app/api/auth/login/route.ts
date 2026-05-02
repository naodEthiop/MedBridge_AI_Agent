import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import type { SessionUser } from "@/lib/auth/types";
import { getDemoUserStore, hashDemoPassword, normalizeEmail } from "@/lib/server/demo-user-store";
import {
  createSessionCookie,
  getSessionSecret,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session-core";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
    }
    const email = normalizeEmail(parsed.data.email);
    const store = getDemoUserStore();
    const row = store.get(email);
    if (!row) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    const pepper = getSessionSecret();
    if (row.passwordHash !== hashDemoPassword(parsed.data.password, pepper)) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const user: SessionUser =
      row.role === "patient"
        ? { email, role: "patient", patientProfile: row.patientProfile }
        : { email, role: "doctor", doctorProfile: row.doctorProfile };

    const token = await createSessionCookie(user);
    const jar = await cookies();
    jar.set(SESSION_COOKIE, token, sessionCookieOptions());

    return NextResponse.json({ ok: true, user });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Login failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
