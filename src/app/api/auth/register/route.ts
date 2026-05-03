import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

import { env, hasSupabasePublicEnv } from '@/lib/env';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const ACCESS_COOKIE_NAME = 'medbridge-access-token';
const REFRESH_COOKIE_NAME = 'medbridge-refresh-token';

const patientSchema = z.object({
  fullName: z.string().min(2),
  age: z.coerce.number().int().min(1).max(130),
  sex: z.enum(['female', 'male', 'other']),
  heightCm: z.coerce.number().min(50).max(280),
  weightKg: z.coerce.number().min(15).max(400),
  bloodType: z.string().min(1),
});

const doctorSchema = z.object({
  fullName: z.string().min(2),
  specialty: z.string().min(1),
  experienceYears: z.coerce.number().int().min(0).max(80),
  clinicName: z.string().min(1),
  licenseNumber: z.string().optional(),
});

const bodySchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('patient'),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    patient: patientSchema,
  }),
  z.object({
    role: z.literal('doctor'),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    doctor: doctorSchema,
  }),
]);

function buildSupabaseClient() {
  if (!hasSupabasePublicEnv) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function sanitizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(request: Request) {
  if (!hasSupabasePublicEnv) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid registration data', details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  if (data.password !== data.confirmPassword) {
    return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
  }

  const email = sanitizeEmail(data.email);
  const role = data.role;

  const supabase = buildSupabaseClient();
  const admin = createSupabaseAdminClient();

  let userId: string | null = null;
  let signInResult;

  try {
    if (admin) {
      const { data: createData, error: createError } = await admin.auth.admin.createUser({
        email,
        password: data.password,
        user_metadata: { role },
        email_confirm: true,
      });
      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }
      userId = createData.user?.id ?? null;
      if (!userId) throw new Error('Failed to create Supabase user.');
    } else {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password: data.password }, { data: { role } });
      if (signUpError) {
        return NextResponse.json({ error: signUpError.message }, { status: 400 });
      }
      userId = signUpData.user?.id ?? null;
      if (!userId) throw new Error('Failed to create Supabase user.');
    }

    const db = admin ?? supabase;
    const { error: userError } = await db.from('users').insert({ id: userId, email, role });
    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    if (role === 'patient') {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - data.patient.age);
      const formattedDob = `${dob.getUTCFullYear()}-${String(dob.getUTCMonth() + 1).padStart(2, '0')}-${String(dob.getUTCDate()).padStart(2, '0')}`;
      const patientPayload = {
        id: userId,
        user_id: userId,
        full_name: data.patient.fullName,
        gender: data.patient.sex,
        dob: formattedDob,
        medical_history: {
          heightCm: data.patient.heightCm,
          weightKg: data.patient.weightKg,
          bloodType: data.patient.bloodType,
        },
      };
      const { error: patientError } = await db.from('patients').insert(patientPayload);
      if (patientError) {
        return NextResponse.json({ error: patientError.message }, { status: 500 });
      }
    } else {
      const doctorPayload = {
        id: userId,
        user_id: userId,
        full_name: data.doctor.fullName,
        specialization: data.doctor.specialty,
        clinic_name: data.doctor.clinicName,
        license_number: data.doctor.licenseNumber ?? null,
      };
      const { error: doctorError } = await db.from('doctors').insert(doctorPayload);
      if (doctorError) {
        return NextResponse.json({ error: doctorError.message }, { status: 500 });
      }
    }

    signInResult = await supabase.auth.signInWithPassword({ email, password: data.password });
    if (signInResult.error || !signInResult.data.session) {
      return NextResponse.json({
        error: signInResult.error?.message ?? 'Registration succeeded, but sign-in failed.',
      }, { status: 500 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const session = signInResult.data.session;
  if (!session) {
    return NextResponse.json({ error: 'Registration completed but no session was created.' }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true, user: { id: userId, email, role } });
  response.cookies.set(ACCESS_COOKIE_NAME, session.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: session.expires_in ?? 3600,
  });
  response.cookies.set(REFRESH_COOKIE_NAME, session.refresh_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
