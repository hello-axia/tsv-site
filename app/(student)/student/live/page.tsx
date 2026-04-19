import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function StudentLivePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  return (
    <main style={{ flex: 1, padding: '2.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Live Session</div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Today&apos;s Lesson</h1>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>Your teacher will start the session when class begins.</p>
      </div>

      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '3rem 2rem', textAlign: 'center' as const }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text)', marginBottom: '0.75rem' }}>
          Waiting for your teacher
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-faint)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
          No live session is active right now. Your teacher will launch the lesson from their dashboard.
        </p>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid var(--gold)', borderTopColor: 'transparent', margin: '0 auto' }} />
      </div>
    </main>
  )
}