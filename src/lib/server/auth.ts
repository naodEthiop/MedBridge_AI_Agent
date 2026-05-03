import { env, hasSupabasePublicEnv } from '@/lib/env';
import { supabase } from '@/lib/db/supabaseClient';

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  role: 'patient' | 'doctor';
  tenantId: string;
};

export class UnauthorizedError extends Error {
  status = 401;

  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

function getAccessTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  const token = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('medbridge-access-token='))
    ?.split('=')
    .slice(1)
    .join('=');

  return token ? decodeURIComponent(token) : null;
}

export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedUser> {
  if (!hasSupabasePublicEnv) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  const accessToken = getAccessTokenFromRequest(request);
  if (!accessToken) {
    throw new UnauthorizedError();
  }

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new UnauthorizedError();
  }

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    role: data.user.user_metadata?.role === 'doctor' ? 'doctor' : 'patient',
    tenantId: data.user.user_metadata?.tenantId || 'default',
  };
}
