import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const role = searchParams.get('role') ?? 'student'

  if (code) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single()

      if (profile) {
        const dest = profile.role === 'teacher' ? '/dashboard' : '/lesson'
        return NextResponse.redirect(`${origin}${dest}`)
      }

      return NextResponse.redirect(`${origin}/onboarding?role=${role}`)
    }
  }

  return NextResponse.redirect(`${origin}/?error=oauth`)
}