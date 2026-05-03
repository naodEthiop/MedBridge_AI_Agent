import { NextResponse } from 'next/server';

import { getAuthenticatedUser, UnauthorizedError } from '@/lib/server/auth';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    return NextResponse.json({ ok: true, authenticated: true, mode: 'supabase', user });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, authenticated: false, error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Unable to fetch user';
    return NextResponse.json({ ok: false, authenticated: false, error: message }, { status: 500 });
  }
}

