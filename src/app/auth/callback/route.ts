import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/db/supabaseServer'
import { env } from '@/lib/env'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await getSupabaseServerClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to the dashboard or proper page after auth
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;
  return NextResponse.redirect(new URL('/dashboard', siteUrl))
}
