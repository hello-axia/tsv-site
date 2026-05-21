import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import ClassSelector from '../_components/class-selector'

type CurrentLesson = {
  id: string
  title: string
  unit: number
  lesson_number: number
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name')
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
  const selectedClass = (classes ?? []).find(c => c.id === selectedClassId) ?? null

  let currentAssignment: { id: string; status: string; lesson: CurrentLesson } | null = null
  let totalEnrolled = 0
  let ledgerSubmittedCount = 0

  if (selectedClassId) {
    // Find the current (live/paused/not_started) assignment.
    const { data: recentAssignment } = await supabase
      .from('lesson_assignments')
      .select('id, status, lesson_id, lessons(id, title, unit, lesson_number)')
      .eq('class_id', selectedClassId)
      .in('status', ['not_started', 'live', 'paused'])
      .maybeSingle()

    if (recentAssignment && recentAssignment.lessons) {
      currentAssignment = {
        id: recentAssignment.id,
        status: recentAssignment.status,
        lesson: recentAssignment.lessons as unknown as CurrentLesson,
      }
    }

    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('student_id')
      .eq('class_id', selectedClassId)

    totalEnrolled = enrollments?.length ?? 0

    // For a live/paused assignment, count Ledger submissions so far.
    if (currentAssignment && (currentAssignment.status === 'live' || currentAssignment.status === 'paused')) {
      const { count } = await supabase
        .from('ledger_entries')
        .select('id', { count: 'exact', head: true })
        .eq('assignment_id', currentAssignment.id)
      ledgerSubmittedCount = count ?? 0
    }
  }

  // "Up Next" — published lessons not yet assigned to this class.
  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id, unit, lesson_number, title, status')
    .eq('status', 'published')
    .order('unit')
    .order('lesson_number')

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

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile.display_name?.split(' ')[0] ?? ''

  return (
    <main style={{ flex: 1, padding: '2.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Teacher Dashboard</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '0.25rem', color: 'var(--text)' }}>
          {greeting}{firstName ? `, ${firstName}` : ''}.
        </h1>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>
          Here&apos;s where things stand.
        </p>
      </div>

      {classes && classes.length > 0 ? (
        <ClassSelector classes={classes} selectedId={selectedClassId} />
      ) : (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-dim)', marginBottom: '0.85rem' }}>
            You don&apos;t have any classes yet.
          </p>
          <a href="/account" style={{ display: 'inline-block', padding: '0.6rem 1.1rem', background: 'var(--gold)', color: '#fff', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
            Create a class →
          </a>
        </div>
      )}

      {selectedClass && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="dash-card">
              <div className="dash-card-label">Today&apos;s Session</div>
              {currentAssignment ? (
                <>
                  <div className="dash-card-value">
                    {currentAssignment.status === 'live' && <><span style={{ color: 'var(--gold)' }}>●</span> Live now</>}
                    {currentAssignment.status === 'paused' && <>⏸ Paused</>}
                    {currentAssignment.status === 'not_started' && <>Ready to start</>}
                  </div>
                  <div className="dash-card-sub">
                    Unit {currentAssignment.lesson.unit} · Lesson {currentAssignment.lesson.lesson_number} — {currentAssignment.lesson.title}
                  </div>
                  <a href="/curriculum" className="dash-card-action">
                    {currentAssignment.status === 'not_started' ? 'Start Session →' : 'Open Live Session →'}
                  </a>
                </>
              ) : (
                <>
                  <div className="dash-card-value" style={{ color: 'var(--text-faint)' }}>Nothing queued</div>
                  <div className="dash-card-sub">Pick a lesson to teach next.</div>
                  <a href="/curriculum" className="dash-card-action">Open Curriculum →</a>
                </>
              )}
            </div>

            <div className="dash-card">
              <div className="dash-card-label">Ledger Submissions</div>
              {currentAssignment && (currentAssignment.status === 'live' || currentAssignment.status === 'paused') && totalEnrolled > 0 ? (
                ledgerSubmittedCount >= totalEnrolled ? (
                  <>
                    <div className="dash-card-value" style={{ color: '#4a8a5a' }}>All in</div>
                    <div className="dash-card-sub">{ledgerSubmittedCount} of {totalEnrolled} entries submitted</div>
                  </>
                ) : (
                  <>
                    <div className="dash-card-value" style={{ color: 'var(--gold)' }}>{ledgerSubmittedCount} <span style={{ color: 'var(--text-faint)', fontWeight: 400, fontSize: '0.9rem' }}>of {totalEnrolled}</span></div>
                    <div className="dash-card-sub">students have submitted their entry</div>
                  </>
                )
              ) : (
                <>
                  <div className="dash-card-value" style={{ color: 'var(--text-faint)' }}>—</div>
                  <div className="dash-card-sub">
                    {totalEnrolled === 0
                      ? 'No students enrolled yet.'
                      : currentAssignment?.status === 'not_started'
                      ? 'Start the session to see submissions.'
                      : 'No active session.'}
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="eyebrow">Up Next</span>
              <a href="/curriculum" style={{ fontSize: '0.75rem', color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>
                View full curriculum →
              </a>
            </div>
            {upNext.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.875rem' }}>
                No more published lessons to assign yet.
              </div>
            ) : (
              upNext.map((l) => (
                <a key={l.id} href={`/lessons/${l.id}`} className="dash-up-next-row"
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.95rem 1.5rem', borderBottom: '1px solid var(--border)', textDecoration: 'none', transition: 'background 0.15s' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--gold)', minWidth: '44px' }}>
                    {l.unit}.{l.lesson_number}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)', marginBottom: '0.15rem' }}>{l.title}</div>
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