import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import ClassSelector from '../_components/class-selector'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Get teacher profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/onboarding?role=teacher')

  // Fetch all classes for this teacher
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
  const selectedClass = (classes ?? []).find(c => c.id === selectedClassId) ?? null

  // Fetch the most recent assignment for the selected class
  let currentLesson: any = null
  let pendingStudents: { id: string; full_name: string | null }[] = []
  let totalEnrolled = 0

  if (selectedClassId) {
    const { data: recentAssignment } = await supabase
      .from('lesson_assignments')
      .select('lesson_id, assigned_date, lessons(id, title, unit, lesson_number, overview)')
      .eq('class_id', selectedClassId)
      .eq('status', 'active')
      .maybeSingle()

    currentLesson = recentAssignment?.lessons ?? null

    // Get all enrolled students
    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('student_id, profiles(id, full_name)')
      .eq('class_id', selectedClassId)

    totalEnrolled = enrollments?.length ?? 0

    if (currentLesson && enrollments && enrollments.length > 0) {
      const studentIds = enrollments.map((e: any) => e.student_id)
      const { data: responses } = await supabase
        .from('lesson_responses')
        .select('student_id')
        .eq('lesson_id', currentLesson.id)
        .in('student_id', studentIds)
        .not('poll_option_id', 'is', null)

      const respondedSet = new Set((responses ?? []).map(r => r.student_id))
      pendingStudents = enrollments
        .filter((e: any) => !respondedSet.has(e.student_id))
        .map((e: any) => ({ id: e.profiles?.id, full_name: e.profiles?.full_name }))
    }
  }

  // Fetch all lessons for the curriculum sidebar
  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id, unit, lesson_number, title, status')
    .eq('status', 'published')
    .order('unit')
    .order('lesson_number')

  // Get all assigned lesson IDs for this class
  let assignedLessonIds = new Set<string>()
  if (selectedClassId) {
    const { data: assignments } = await supabase
      .from('lesson_assignments')
      .select('lesson_id')
      .eq('class_id', selectedClassId)
    assignedLessonIds = new Set((assignments ?? []).map(a => a.lesson_id))
  }

  const upNext = (allLessons ?? [])
    .filter(l => !assignedLessonIds.has(l.id))
    .slice(0, 3)

  // Greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile.display_name?.split(' ')[0] ?? ''

  return (
    <main style={{ flex: 1, padding: '2.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Teacher Dashboard</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '0.25rem', color: 'var(--text)' }}>
          {greeting}{firstName ? `, ${firstName}` : ''}.
        </h1>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>
          Here&apos;s where things stand.
        </p>
      </div>

      {/* Class selector */}
      {classes && classes.length > 0 ? (
        <ClassSelector classes={classes} selectedId={selectedClassId} />
      ) : (
        <div style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-dim)', marginBottom: '0.85rem' }}>
            You don&apos;t have any classes yet.
          </p>
          <a href="/account" style={{
            display: 'inline-block',
            padding: '0.6rem 1.1rem',
            background: 'var(--gold)',
            color: '#fff',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            Create a class →
          </a>
        </div>
      )}

      {selectedClass && (
        <>
          {/* Three metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>

            {/* 1. Session status */}
            <div className="dash-card">
              <div className="dash-card-label">Today&apos;s Session</div>
              {currentLesson ? (
                <>
                  <div className="dash-card-value">
                    <span style={{ color: 'var(--gold)' }}>●</span> Ready to teach
                  </div>
                  <div className="dash-card-sub">
                    {currentLesson.title}
                  </div>
                  <a href="/live" className="dash-card-action">
                    Start Live Session →
                  </a>
                </>
              ) : (
                <>
                  <div className="dash-card-value" style={{ color: 'var(--text-faint)' }}>
                    Nothing queued
                  </div>
                  <div className="dash-card-sub">
                    Pick a lesson to teach next
                  </div>
                  <a href="/curriculum" className="dash-card-action">
                    Open Curriculum →
                  </a>
                </>
              )}
            </div>

            {/* 2. Today's lesson preview */}
            <div className="dash-card">
              <div className="dash-card-label">Lesson Overview</div>
              {currentLesson ? (
                <>
                  <div className="dash-card-value" style={{ fontSize: '1.05rem', lineHeight: 1.3 }}>
                    Unit {currentLesson.unit} · Lesson {currentLesson.lesson_number}
                  </div>
                  <div className="dash-card-sub" style={{
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {currentLesson.overview ?? 'No overview available.'}
                  </div>
                  <a href={`/lessons/${currentLesson.id}`} className="dash-card-action">
                    Preview →
                  </a>
                </>
              ) : (
                <>
                  <div className="dash-card-value" style={{ color: 'var(--text-faint)' }}>
                    —
                  </div>
                  <div className="dash-card-sub">
                    Assign a lesson to see its overview here.
                  </div>
                </>
              )}
            </div>

            {/* 3. Pending poll responses */}
            <div className="dash-card">
              <div className="dash-card-label">Awaiting Response</div>
              {currentLesson && totalEnrolled > 0 ? (
                pendingStudents.length === 0 ? (
                  <>
                    <div className="dash-card-value" style={{ color: '#4a8a5a' }}>
                      All responded
                    </div>
                    <div className="dash-card-sub">
                      {totalEnrolled} of {totalEnrolled} students submitted
                    </div>
                  </>
                ) : (
                  <>
                    <div className="dash-card-value" style={{ color: 'var(--gold)' }}>
                      {pendingStudents.length}
                    </div>
                    <div className="dash-card-sub">
                      of {totalEnrolled} haven&apos;t answered the poll yet
                    </div>
                    <a href={`/classes/${selectedClass.class_code}`} className="dash-card-action">
                      View class →
                    </a>
                  </>
                )
              ) : (
                <>
                  <div className="dash-card-value" style={{ color: 'var(--text-faint)' }}>
                    —
                  </div>
                  <div className="dash-card-sub">
                    {totalEnrolled === 0 ? 'No students enrolled yet.' : 'No active lesson.'}
                  </div>
                </>
              )}
            </div>

          </div>

          {/* Up Next */}
          <div style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span className="eyebrow">Up Next</span>
              <a href="/curriculum" style={{
                fontSize: '0.75rem',
                color: 'var(--gold)',
                textDecoration: 'none',
                fontWeight: 600,
              }}>
                View full curriculum →
              </a>
            </div>
            {upNext.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.875rem' }}>
                You&apos;ve assigned all available lessons. Nice.
              </div>
            ) : (
              upNext.map((l) => (
                <a
                  key={l.id}
                  href={`/lessons/${l.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.95rem 1.5rem',
                    borderBottom: '1px solid var(--border)',
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                  className="dash-up-next-row"
                >
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.95rem',
                    color: 'var(--gold)',
                    minWidth: '44px',
                  }}>
                    {l.unit}.{l.lesson_number}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)', marginBottom: '0.15rem' }}>
                      {l.title}
                    </div>
                    <div className="muted">Unit {l.unit}</div>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-faint)' }}>→</span>
                </a>
              ))
            )}
          </div>
        </>
      )}
    </main>
  )
}