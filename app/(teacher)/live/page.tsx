import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import ClassSelector from '../_components/class-selector'
import { getCurrentSessionForClass } from '@/lib/live-session'
import { getLessonContentHtml } from '@/lib/lesson-content'
import LiveSessionControls from './live-session-controls'
import type { LessonMeta } from '@/lib/lesson-meta-types'

async function loadLessonMeta(slug: string): Promise<LessonMeta | null> {
  try {
    const mod = await import(`@/content/lessons/${slug}.meta`)
    return (mod.meta ?? null) as LessonMeta | null
  } catch {
    return null
  }
}

export default async function LivePage() {
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
    const selectedClass = (classes ?? []).find(c => c.id === selectedClassCookie) ?? classes?.[0] ?? null
    const selectedClassId = selectedClass?.id ?? null
    const selectedClassCode = selectedClass?.class_code ?? null

  const session = selectedClassId
    ? await getCurrentSessionForClass(supabase, selectedClassId)
    : null
    const briefingHtml = session ? getLessonContentHtml(session.lesson.slug) : null
    const meta = session ? await loadLessonMeta(session.lesson.slug) : null



  return (
    <main style={{ flex: 1, padding: '2.5rem 1.5rem 4rem' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Live Session</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.25rem', color: 'var(--text)' }}>
            Teacher Cockpit
          </h1>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>
            Pace the class. Unlock each step when the room is ready.
          </p>
        </div>

        {classes && classes.length > 0 && (
          <ClassSelector classes={classes} selectedId={selectedClassId} />
        )}

        {!session ? (
          <EmptyState />
        ) : session.status === 'not_started' ? (
          <NotStartedState
            lessonTitle={session.lesson.title}
            unit={session.lesson.unit}
            lessonNumber={session.lesson.lesson_number}
          />
        ) : (
          <LiveSessionControls
            assignmentId={session.assignment_id}
            lessonId={session.lesson.id}
            lessonSlug={session.lesson.slug}
            lessonTitle={session.lesson.title}
            unit={session.lesson.unit}
            lessonNumber={session.lesson.lesson_number}
            status={session.status}
            initialStep={session.current_step}
            briefingHtml={briefingHtml}
            meta={meta}
            profileId={profile.id}
            classCode={selectedClassCode}
          />
        )}
      </div>
    </main>
  )
}

function EmptyState() {
  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '3rem 2rem',
      textAlign: 'center',
      marginTop: '1.5rem',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--text)', marginBottom: '0.75rem' }}>
        No active session
      </div>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
        Assign a lesson and start a session from the curriculum to teach live.
      </p>
      <a href="/curriculum" style={{
        display: 'inline-block',
        padding: '0.6rem 1.1rem',
        background: 'var(--gold)',
        color: '#fff',
        borderRadius: '6px',
        fontSize: '0.82rem',
        fontWeight: 600,
        textDecoration: 'none',
      }}>
        Go to Curriculum →
      </a>
    </div>
  )
}

function NotStartedState({ lessonTitle, unit, lessonNumber }: { lessonTitle: string; unit: number; lessonNumber: number }) {
  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '3rem 2rem',
      textAlign: 'center',
      marginTop: '1.5rem',
    }}>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
        Unit {unit} · Lesson {lessonNumber}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--text)', marginBottom: '0.75rem' }}>
        {lessonTitle}
      </div>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
        This lesson is queued. Start the session from the curriculum to begin.
      </p>
      <a href="/curriculum" style={{
        display: 'inline-block',
        padding: '0.6rem 1.1rem',
        background: 'var(--gold)',
        color: '#fff',
        borderRadius: '6px',
        fontSize: '0.82rem',
        fontWeight: 600,
        textDecoration: 'none',
      }}>
        Back to Curriculum
      </a>
    </div>
  )
}