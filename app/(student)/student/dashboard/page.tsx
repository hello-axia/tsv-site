import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const YEAR_END_DATE = new Date('2026-06-13')
const TOTAL_LESSONS = 170

function getPacing(lessonsCompleted: number) {
  const today = new Date()
  const daysLeft = Math.ceil((YEAR_END_DATE.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const lessonsLeft = TOTAL_LESSONS - lessonsCompleted
  const requiredPerDay = Math.round((lessonsLeft / daysLeft) * 10) / 10
  const onPace = requiredPerDay <= 1
  return { daysLeft, onPace, requiredPerDay }
}

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const lessonsCompleted = 0
  const { daysLeft, onPace, requiredPerDay } = getPacing(lessonsCompleted)

  return (
    <main style={{ flex: 1, padding: '2.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Student Dashboard</div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Good morning.</h1>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>Here&apos;s where things stand today.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Lessons Completed', value: `${lessonsCompleted}`, sub: `of ${TOTAL_LESSONS} · Year 1`, color: 'var(--gold)' },
          { label: 'Days Left in Year', value: `${daysLeft}`, sub: `Until ${YEAR_END_DATE.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`, color: 'var(--text)' },
          { label: 'Pacing', value: onPace ? 'On pace' : 'Behind', sub: onPace ? 'Finishing on schedule' : `Need ${requiredPerDay} lessons/day`, color: onPace ? '#4a7c59' : '#c0392b' },
        ].map(m => (
          <div key={m.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
            <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>{m.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: m.color, lineHeight: 1, marginBottom: '0.25rem' }}>{m.value}</div>
            <div className="muted">{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '2rem' }}>
        <div className="eyebrow" style={{ marginBottom: '1rem' }}>Today&apos;s Lesson</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text)', lineHeight: 1.2, marginBottom: '0.5rem' }}>
          No lesson assigned yet
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-faint)', marginBottom: '2rem' }}>
          Your teacher hasn&apos;t assigned today&apos;s lesson yet. Check back soon.
        </div>
        <a href="/student/live" style={{ padding: '0.75rem 1.5rem', background: 'var(--gold)', color: 'var(--bg)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none' }}>
          Join Today&apos;s Lesson →
        </a>
      </div>
    </main>
  )
}