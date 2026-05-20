import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function StudentTodayLessonPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  return (
    <main style={{ flex: 1, padding: '2.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Today&apos;s Lesson</div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Coming soon</h1>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>
          This view is being rebuilt for the new lesson model.
        </p>
      </div>
      <div style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '3rem 2rem',
        textAlign: 'center',
      }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', maxWidth: '440px', margin: '0 auto' }}>
          When your teacher starts a live session, you&apos;ll see it here.
          For now, you can browse the curriculum.
        </p>
        <a href="/student/curriculum" style={{
          display: 'inline-block',
          marginTop: '1.5rem',
          padding: '0.6rem 1.1rem',
          background: 'var(--gold)',
          color: '#fff',
          borderRadius: '6px',
          fontSize: '0.82rem',
          fontWeight: 600,
          textDecoration: 'none',
        }}>
          View Curriculum →
        </a>
      </div>
    </main>
  )
}