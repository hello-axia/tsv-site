import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '2rem' }}>The Student's Verdict</h1>
      <a href="/api/auth/login" style={{ padding: '0.75rem 2rem', background: '#1a1a14', color: '#c8a96e', textDecoration: 'none', borderRadius: '4px' }}>
        Sign in with Google
      </a>
    </main>
  )
}