import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LessonPoll from './poll'

export default async function LessonPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/')

  // Get class enrollment
  const { data: enrollment } = await supabase
    .from('class_enrollments')
    .select('class_id')
    .eq('student_id', profile.id)
    .single()

  if (!enrollment) {
    return (
      <div style={{ padding: '4rem 2rem', fontFamily: 'var(--font-body)', color: 'var(--text-dim)' }}>
        You are not enrolled in a class.
      </div>
    )
  }

  // Get today's assignment
  const today = new Date().toISOString().split('T')[0]
  const { data: assignment } = await supabase
    .from('lesson_assignments')
    .select('lesson_id')
    .eq('class_id', enrollment.class_id)
    .eq('assigned_date', today)
    .single()

  if (!assignment) {
    return (
      <div style={{ padding: '4rem 2rem', fontFamily: 'var(--font-body)', color: 'var(--text-dim)' }}>
        No lesson assigned for today.
      </div>
    )
  }

  // Get lesson
  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, unit, lesson_number, article_body, poll_question')
    .eq('id', assignment.lesson_id)
    .single()

  if (!lesson) {
    return (
      <div style={{ padding: '4rem 2rem', fontFamily: 'var(--font-body)', color: 'var(--text-dim)' }}>
        Lesson not found.
      </div>
    )
  }

  // Get poll options
  const { data: pollOptions } = await supabase
    .from('poll_options')
    .select('id, option_text, display_order')
    .eq('lesson_id', lesson.id)
    .order('display_order')

  // Get existing response
  const { data: existingResponse } = await supabase
    .from('lesson_responses')
    .select('id, poll_option_id')
    .eq('student_id', profile.id)
    .eq('lesson_id', lesson.id)
    .single()

  return (
    <div style={{
      maxWidth: '720px',
      margin: '0 auto',
      padding: '4rem 2rem',
      fontFamily: 'var(--font-body)',
      color: 'var(--text)',
    }}>
      <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1rem' }}>
        Unit {lesson.unit} · Lesson {lesson.lesson_number}
      </p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', lineHeight: 1.15, marginBottom: '2.5rem', color: 'var(--text)' }}>
        {lesson.title}
      </h1>

      <div
        className="lesson-body"
        dangerouslySetInnerHTML={{ __html: lesson.article_body }}
      />

      {pollOptions && pollOptions.length > 0 && (
        <LessonPoll
          question={lesson.poll_question}
          options={pollOptions}
          lessonId={lesson.id}
          studentId={profile.id}
          existingResponseId={existingResponse?.id ?? null}
          existingOptionId={existingResponse?.poll_option_id ?? null}
        />
      )}
    </div>
  )
}