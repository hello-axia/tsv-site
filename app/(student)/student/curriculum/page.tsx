import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CURRICULUM, LESSON_COUNT } from '@/lib/curriculum'

type LessonRow = { id: string; slug: string | null; status: string }

export default async function StudentCurriculumPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!profile) redirect('/')

  // Published lessons are visible to students.
  const { data: lessonRows } = await supabase
    .from('lessons')
    .select('id, slug, status')
    .eq('status', 'published')

  const lessonBySlug: Record<string, LessonRow> = {}
  for (const row of (lessonRows ?? []) as LessonRow[]) {
    if (row.slug) lessonBySlug[row.slug] = row
  }

  // Which lessons has THIS student completed (= has a ledger entry)?
  const { data: ledgerRows } = await supabase
    .from('ledger_entries')
    .select('lesson_id')
    .eq('student_id', profile.id)

  const completedLessonIds = new Set((ledgerRows ?? []).map((r: { lesson_id: string }) => r.lesson_id))

  return (
    <main style={{ flex: 1, padding: '2.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Curriculum</div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>The Student&apos;s Verdict</h1>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>
          {LESSON_COUNT} lessons across {CURRICULUM.length} units. Open a completed lesson to revisit your work.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {CURRICULUM.map((u) => (
          <div key={u.unit} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--gold)', minWidth: '32px' }}>{u.unit}</span>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>{u.title}</div>
                <div className="muted">{u.lessons.length} lessons</div>
              </div>
            </div>
            {u.lessons.map((l) => {
              const row = lessonBySlug[l.slug]
              const published = !!row
              const completed = published && completedLessonIds.has(row.id)
              // Published lessons are clickable (briefing at minimum; full archive if completed).
              const clickable = published

              const status = completed ? 'Completed' : published ? 'Available' : 'Coming Soon'
              const statusColor = completed ? '#2f5d62' : published ? 'var(--gold)' : 'var(--text-faint)'

              return (
                <div key={l.slug} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--gold)', minWidth: '32px' }}>{l.unit}.{l.lessonNumber}</span>
                  {clickable ? (
                    <a
                      href={`/student/lesson/${l.slug}`}
                      style={{ fontSize: '0.85rem', color: 'var(--text)', textDecoration: 'none', flex: 1 }}
                    >
                      {l.title}
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-faint)', flex: 1 }}>{l.title}</span>
                  )}
                  <span style={{
                    fontSize: '0.7rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: statusColor,
                    fontWeight: 600,
                  }}>
                    {status}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </main>
  )
}