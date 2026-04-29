import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const role = searchParams.get('role') ?? 'student'

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=oauth`)
  }

  const supabase = await createClient()
  const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

  if (sessionError || !sessionData?.session?.user) {
    return NextResponse.redirect(`${origin}/?error=oauth`)
  }

  const userId = sessionData.session.user.id

  // Force a fresh client read so the cookie context is in place
  // before we query profiles (this is the race condition fix)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  if (profile) {
    const dest = profile.role === 'teacher' ? '/dashboard' : '/student/dashboard'
    return NextResponse.redirect(`${origin}${dest}`)
  }

  return NextResponse.redirect(`${origin}/onboarding?role=${role}`)
}