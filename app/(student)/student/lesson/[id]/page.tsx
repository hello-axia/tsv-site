import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function StudentLessonPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, unit, lesson_number, overview, status')
    .eq('id', id)
    .single()

  if (!lesson || lesson.status !== 'published') {
    return (
      <main style={{ flex: 1, padding: '3rem 2rem' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <p style={{ color: 'var(--text-dim)' }}>Lesson not available.</p>
        </div>
      </main>
    )
  }

  // TODO: When live sessions are built, check if there's an active session for this lesson
  // and redirect to /lesson if so.

  return (
    <main style={{ flex: 1, padding: '3rem 2rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{
            fontSize: '0.7rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            marginBottom: '0.6rem',
          }}>
            Unit {lesson.unit} · Lesson {lesson.lesson_number}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            lineHeight: 1.15,
            margin: '0 0 0.85rem',
            color: 'var(--text)',
          }}>
            {lesson.title}
          </h1>
        </div>

        {lesson.overview && (
          <div className="lesson-overview-card">
            <div className="lesson-overview-label">Lesson Overview</div>
            <p className="lesson-overview-text">{lesson.overview}</p>
          </div>
        )}

        <div style={{
          marginTop: '2.5rem',
          padding: '2rem',
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '0.7rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            marginBottom: '0.6rem',
            fontWeight: 600,
          }}>
            Waiting for your teacher
          </div>
          <p style={{
            fontSize: '0.95rem',
            color: 'var(--text-dim)',
            margin: 0,
            lineHeight: 1.65,
          }}>
            The full lesson opens when your teacher starts the live session.
          </p>
        </div>
      </div>
    </main>
  )
}