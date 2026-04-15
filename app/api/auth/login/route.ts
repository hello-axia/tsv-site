import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url)
  const role = searchParams.get('role') ?? 'student'

  const supabase = await createClient()
  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?role=${role}`,
    },
  })

  if (data.url) return NextResponse.redirect(data.url)
  return NextResponse.redirect(`${origin}/?error=oauth`)
}
