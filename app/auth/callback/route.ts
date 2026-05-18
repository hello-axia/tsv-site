import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const roleParam = searchParams.get('role') ?? 'student'

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=oauth`)
  }

  const supabase = await createClient()
  const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

  if (sessionError || !sessionData?.session?.user) {
    return NextResponse.redirect(`${origin}/?error=oauth`)
  }

  const userId = sessionData.session.user.id

  const { data: profileRole, error: roleError } = await supabase
    .rpc('profile_role_for_user', { p_user_id: userId })

  if (profileRole) {
    const dest = profileRole === 'teacher' ? '/dashboard' : '/student/dashboard'
    return NextResponse.redirect(`${origin}${dest}`)
  }

  return NextResponse.redirect(`${origin}/onboarding?role=${roleParam}`)
}