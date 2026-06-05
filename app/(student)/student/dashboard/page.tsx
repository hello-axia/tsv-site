import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentLiveSessionForStudent } from '@/lib/live-session'

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/')

  // Real completion: how many lessons has THIS student finished (= has a ledger entry).
  const { count: completedCount } = await supabase
    .from('ledger_entries')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', profile.id)

  // Real denominator: published lessons that actually exist.
  const { count: publishedCount } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')

  const completed = completedCount ?? 0
  const published = publishedCount ?? 0

  // Is a session live right now for this student's class?
  const liveSession = await getCurrentLiveSessionForStudent(supabase, profile.id)

  const firstName = (profile.display_name ?? '').trim().split(/\s+/)[0] || null

  return (
    <main style={{ flex: 1, padding: '2.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Student Dashboard</div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
          {firstName ? `Welcome back, ${firstName}.` : 'Welcome back.'}
        </h1>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>
          Your teacher runs each lesson live — this is where you join in and look back on your work.
        </p>
      </div>

      {/* Live session hero — the one actionable thing */}
      {liveSession ? (
        <div style={{
          background: 'var(--gold-dim)',
          border: '1px solid var(--gold)',
          borderRadius: '8px',
          padding: '2rem',
          marginBottom: '2rem',
        }}>
          <div className="eyebrow" style={{ marginBottom: '1rem', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
            {liveSession.status === 'paused' ? 'Class paused' : 'Live now'}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text)', lineHeight: 1.2, marginBottom: '0.5rem' }}>
            {liveSession.lesson.title}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '2rem' }}>
            Unit {liveSession.lesson.unit} · Lesson {liveSession.lesson.lesson_number}
            {liveSession.status === 'paused' ? ' · your teacher will resume shortly' : ' · your teacher is running this now'}
          </div>
          <a href="/student/live" style={{ padding: '0.75rem 1.5rem', background: 'var(--gold)', color: 'var(--bg)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none' }}>
            Join the lesson →
          </a>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '2rem',
          marginBottom: '2rem',
        }}>
          <div className="eyebrow" style={{ marginBottom: '1rem' }}>Live Session</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text)', lineHeight: 1.2, marginBottom: '0.5rem' }}>
            No live lesson right now
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-faint)' }}>
            When your teacher starts a lesson, it&apos;ll appear here and you can join. Until then, you can review your past work in the Curriculum.
          </div>
        </div>
      )}

      {/* Honest progress + reference row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '1rem' }}>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
          <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Lessons Completed</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)', lineHeight: 1, marginBottom: '0.25rem' }}>
            {completed}<span style={{ fontSize: '1rem', color: 'var(--text-faint)' }}> / {published}</span>
          </div>
          <div className="muted">Lessons you&apos;ve finished and can review</div>
        </div>
        <a href="/student/curriculum" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem', textDecoration: 'none', display: 'block' }}>
          <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Your Record</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text)', lineHeight: 1.1, marginBottom: '0.25rem' }}>
            Curriculum &amp; Ledger →
          </div>
          <div className="muted">Revisit every lesson you&apos;ve completed and what you wrote</div>
        </a>
      </div>
    </main>
  )
}