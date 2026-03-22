import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LessonPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  return (
    <div style={{
      fontFamily: 'Georgia, serif',
      maxWidth: '720px',
      margin: '0 auto',
      padding: '4rem 2rem',
      color: '#1a1a14'
    }}>
      <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c8a96e', marginBottom: '1rem' }}>
        Lesson 47 · AP Gov
      </p>
      <h1 style={{ fontSize: '2.5rem', lineHeight: 1.15, marginBottom: '2rem' }}>
        Should the U.S. Have a Federal Minimum Wage?
      </h1>
      <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#5a5a4a' }}>
        Logged in as: {user.email}
      </p>
    </div>
  )
}