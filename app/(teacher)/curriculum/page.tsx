import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import ClassSelector from '../_components/class-selector'
import AssignButton from './assign-button'
import ActiveLessonBanner from './active-lesson-banner'
import { CURRICULUM, LESSON_COUNT } from '@/lib/curriculum'

type LessonRow = { id: string; slug: string | null; unit: number; lesson_number: number; title: string; status: string }
type Assignment = { id: string; lesson_id: string; status: string; current_step: string | null }

export default async function CurriculumPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/onboarding?role=teacher')

  const { data: classes } = await supabase
    .from('classes')
    .select('id, class_code, name')
    .eq('teacher_id', profile.id)
    .order('name')

  const cookieStore = await cookies()
  const selectedClassCookie = cookieStore.get('selected_class_id')?.value
  const selectedClassId = (classes ?? []).find(c => c.id === selectedClassCookie)?.id
    ?? classes?.[0]?.id
    ?? null

  // Pull lesson DB rows keyed by slug.
  const { data: lessonRows } = await supabase
    .from('lessons')
    .select('id, slug, unit, lesson_number, title, status')

  const lessonBySlug: Record<string, LessonRow> = {}
  const lessonById: Record<string, LessonRow> = {}
  for (const row of (lessonRows ?? []) as LessonRow[]) {
    if (row.slug) lessonBySlug[row.slug] = row
    lessonById[row.id] = row
  }

  // Assignments for selected class.
  const assignmentByLessonId: Record<string, Assignment> = {}
  let currentAssignment: (Assignment & { lesson?: LessonRow }) | null = null

  if (selectedClassId) {
    const { data: assignments } = await supabase
      .from('lesson_assignments')
      .select('id, lesson_id, status, current_step')
      .eq('class_id', selectedClassId)

    for (const a of (assignments ?? []) as Assignment[]) {
      assignmentByLessonId[a.lesson_id] = a
      // The "current" assignment is the one not_started, live, or paused.
      // Completed assignments are history.
      if (a.status === 'not_started' || a.status === 'live' || a.status === 'paused') {
        currentAssignment = { ...a, lesson: lessonById[a.lesson_id] }
      }
    }
  }

  return (
    <main style={{ flex: 1, padding: '2.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Curriculum</div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>The Student&apos;s Verdict</h1>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>
          {LESSON_COUNT} lessons across {CURRICULUM.length} units.
        </p>
      </div>

      {classes && classes.length > 0 && (
        <ClassSelector classes={classes} selectedId={selectedClassId} />
      )}

{currentAssignment && currentAssignment.lesson && (
        <ActiveLessonBanner
        assignmentId={currentAssignment.id}
        lessonTitle={currentAssignment.lesson.title}
        lessonSlug={currentAssignment.lesson.slug ?? ''}
        unit={currentAssignment.lesson.unit}
        lessonNumber={currentAssignment.lesson.lesson_number}
        status={currentAssignment.status as 'not_started' | 'live' | 'paused' | 'completed'}
      />
      )}

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
              const published = row?.status === 'published'
              const assignment = row ? assignmentByLessonId[row.id] : undefined
              const lessonStatus = assignment?.status
              return (
                <div key={l.slug} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--gold)', minWidth: '32px' }}>{l.unit}.{l.lessonNumber}</span>
                  <a
                  href={`/lessons/${l.slug}`}
                    style={{ fontSize: '0.85rem', color: 'var(--text)', textDecoration: 'none', flex: 1 }}
                  >
                    {l.title}
                  </a>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: published ? '#4a8a5a' : 'var(--text-faint)',
                      fontWeight: 600,
                    }}>
                      {published ? 'Published' : 'Draft'}
                    </span>
                    {row && published && selectedClassId ? (
                      lessonStatus === 'completed' ? (
                        <span style={badgeStyle('#4a8a5a', 'rgba(106,191,123,0.12)', 'rgba(106,191,123,0.3)')}>
                          ✓ Completed
                        </span>
                      ) : lessonStatus === 'live' || lessonStatus === 'paused' ? (
                        <span style={badgeStyle('var(--gold)', 'var(--gold-dim)', 'var(--gold)')}>
                          {lessonStatus === 'live' ? '● Live' : '⏸ Paused'}
                        </span>
                      ) : lessonStatus === 'not_started' ? (
                        <span style={badgeStyle('var(--text-dim)', 'var(--bg2)', 'var(--border)')}>
                          Queued
                        </span>
                      ) : (
                        <AssignButton
                          lessonId={row.id}
                          classId={selectedClassId}
                          disabled={!!currentAssignment}
                        />
                      )
                    ) : (
                      <span style={{
                        padding: '0.35rem 0.85rem',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        color: 'var(--text-faint)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                      }}>
                        —
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      
    </main>
    
  )
}

function badgeStyle(color: string, bg: string, border: string) {
  return {
    padding: '0.35rem 0.85rem',
    fontSize: '0.7rem',
    fontWeight: 600 as const,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    color,
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: '4px',
  }
}