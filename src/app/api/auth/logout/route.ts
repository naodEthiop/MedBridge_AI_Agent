import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { SESSION_COOKIE } from '@/lib/auth/session-core';

const ACCESS_COOKIE_NAME = 'medbridge-access-token';
const REFRESH_COOKIE_NAME = 'medbridge-refresh-token';

export async function POST() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
  jar.set(ACCESS_COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
  jar.set(REFRESH_COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
  return NextResponse.json({ ok: true });
}
