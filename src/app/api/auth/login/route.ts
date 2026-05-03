import { NextResponse } from 'next/server';
import { z } from 'zod';

import { env, hasSupabasePublicEnv } from '@/lib/env';
import { supabase } from '@/lib/db/supabaseClient';

const ACCESS_COOKIE_NAME = 'medbridge-access-token';
const REFRESH_COOKIE_NAME = 'medbridge-refresh-token';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

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
    return NextResponse.json({ error: 'Invalid login data', details: parsed.error.flatten() }, { status: 400 });
  }

  const { email: rawEmail, password } = parsed.data;
  const email = sanitizeEmail(rawEmail);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return NextResponse.json({ error: error?.message ?? 'Login failed.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE_NAME, data.session.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: data.session.expires_in ?? 3600,
  });
  response.cookies.set(REFRESH_COOKIE_NAME, data.session.refresh_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
