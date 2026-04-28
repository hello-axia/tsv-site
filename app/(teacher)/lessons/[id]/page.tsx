import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLessonHTML } from '@/lib/lessons'
import LessonInteractions from './lesson-interactions'

export default async function TeacherLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, unit, lesson_number, overview, poll_question, status')
    .eq('id', id)
    .single()

  if (!lesson) {
    return (
      <main style={{ flex: 1, padding: '2.5rem' }}>
        <p style={{ color: 'var(--text-dim)' }}>Lesson not found.</p>
      </main>
    )
  }

  const { data: pollOptions } = await supabase
    .from('poll_options')
    .select('id, option_text, display_order')
    .eq('lesson_id', lesson.id)
    .order('display_order')

  const html = getLessonHTML(lesson.unit, lesson.lesson_number)

  return (
    <main style={{ flex: 1, padding: '3rem 2rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        {/* Header */}
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
          <div style={{
            fontSize: '0.78rem',
            color: 'var(--text-faint)',
            display: 'flex',
            gap: '0.6rem',
            alignItems: 'center',
          }}>
            <span>Lesson {lesson.lesson_number} of 60</span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span>~8 min read</span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span>One position to take at the end</span>
          </div>
        </div>

        {/* Overview card */}
        {lesson.overview && (
          <div className="lesson-overview-card">
            <div className="lesson-overview-label">Lesson Overview</div>
            <p className="lesson-overview-text">{lesson.overview}</p>
          </div>
        )}

        {/* Article body */}
        {html ? (
          <>
            <div className="lesson-body" dangerouslySetInnerHTML={{ __html: html }} />
            <LessonInteractions />
          </>
        ) : (
          <div style={{
            padding: '2rem',
            background: 'var(--bg2)',
            border: '1px dashed var(--border)',
            borderRadius: '8px',
            textAlign: 'center',
            color: 'var(--text-faint)',
            fontSize: '0.875rem',
          }}>
            No content file found. Create <code>content/lessons/u{lesson.unit}-l{lesson.lesson_number}.html</code> in VS Code.
          </div>
        )}

        {/* Poll preview */}
        {lesson.poll_question && (
          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
            <div style={{
              fontSize: '0.7rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              marginBottom: '0.75rem',
            }}>
              The Verdict — Poll Preview
            </div>
            <p style={{
              fontSize: '1.1rem',
              fontFamily: 'var(--font-display)',
              color: 'var(--text)',
              marginBottom: '1.25rem',
            }}>
              {lesson.poll_question}
            </p>
            {pollOptions && pollOptions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pollOptions.map((opt) => (
                  <div key={opt.id} style={{
                    padding: '0.75rem 1.1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    color: 'var(--text-dim)',
                    background: 'var(--bg2)',
                  }}>
                    {opt.option_text}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-faint)' }}>No poll options added yet.</p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}