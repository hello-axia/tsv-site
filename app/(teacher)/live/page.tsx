import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import ClassSelector from '../_components/class-selector'

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
  const selectedClassId = (classes ?? []).find(c => c.id === selectedClassCookie)?.id
    ?? classes?.[0]?.id
    ?? null
  const selectedClass = (classes ?? []).find(c => c.id === selectedClassId) ?? null

  // Fetch the most recent assignment for the selected class
  let currentLesson: any = null
  let students: any[] = []
  let pollResults: { option_id: string; option_text: string; count: number }[] = []
  let totalResponses = 0

  if (selectedClassId) {
    const { data: recentAssignment } = await supabase
      .from('lesson_assignments')
      .select('lesson_id, lessons(id, title, unit, lesson_number, poll_question)')
      .eq('class_id', selectedClassId)
      .eq('status', 'active')
      .maybeSingle()

    currentLesson = recentAssignment?.lessons ?? null

    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('student_id, profiles(id, display_name)')
      .eq('class_id', selectedClassId)

    if (currentLesson && enrollments) {
      const studentIds = enrollments.map((e: any) => e.student_id)
      const { data: responses } = await supabase
        .from('lesson_responses')
        .select('student_id, poll_option_id')
        .eq('lesson_id', currentLesson.id)
        .in('student_id', studentIds)

      const responseMap = new Map<string, string | null>()
      ;(responses ?? []).forEach((r: any) => responseMap.set(r.student_id, r.poll_option_id))

      students = enrollments.map((e: any) => ({
        id: e.profiles?.id,
        name: e.profiles?.display_name ?? 'Unknown',
        responded: responseMap.has(e.student_id) && responseMap.get(e.student_id) !== null,
      }))

      // Poll tally
      const { data: options } = await supabase
        .from('poll_options')
        .select('id, option_text, display_order')
        .eq('lesson_id', currentLesson.id)
        .order('display_order')

      const tally: Record<string, number> = {}
      ;(responses ?? []).forEach((r: any) => {
        if (r.poll_option_id) {
          tally[r.poll_option_id] = (tally[r.poll_option_id] ?? 0) + 1
          totalResponses++
        }
      })

      pollResults = (options ?? []).map(o => ({
        option_id: o.id,
        option_text: o.option_text,
        count: tally[o.id] ?? 0,
      }))
    }
  }

  return (
    <main style={{ flex: 1, padding: '2.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

      <div style={{ marginBottom: '2rem' }}>
        <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Live Session</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '0.25rem', color: 'var(--text)' }}>
          Live Session
        </h1>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>
          Monitor student progress and poll results in real time.
        </p>
      </div>

      {classes && classes.length > 0 ? (
        <ClassSelector classes={classes} selectedId={selectedClassId} />
      ) : (
        <div style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1.5rem',
          textAlign: 'center',
          color: 'var(--text-dim)',
          fontSize: '0.92rem',
        }}>
          No classes yet. <a href="/account" style={{ color: 'var(--gold)' }}>Create one</a> to start a session.
        </div>
      )}

      {selectedClass && (
        <>
          {/* Active lesson card */}
          <div style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '1.75rem 2rem',
            marginBottom: '1.5rem',
          }}>
            <div className="eyebrow" style={{ marginBottom: '0.85rem' }}>Active Lesson</div>
            {currentLesson ? (
              <>
                <div style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-faint)',
                  marginBottom: '0.4rem',
                }}>
                  Unit {currentLesson.unit} · Lesson {currentLesson.lesson_number}
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.6rem',
                  color: 'var(--text)',
                  lineHeight: 1.25,
                  marginBottom: '0.5rem',
                }}>
                  {currentLesson.title}
                </div>
                {currentLesson.poll_question && (
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: '1.25rem' }}>
                    {currentLesson.poll_question}
                  </p>
                )}
                <a href={`/lessons/${currentLesson.id}`} style={{
                  display: 'inline-block',
                  padding: '0.6rem 1.1rem',
                  background: 'transparent',
                  border: '1px solid var(--gold)',
                  color: 'var(--gold)',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}>
                  Open Lesson →
                </a>
              </>
            ) : (
              <>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.4rem',
                  color: 'var(--text-faint)',
                  marginBottom: '0.5rem',
                }}>
                  No lesson assigned yet
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', marginBottom: '1.25rem' }}>
                  Pick a lesson from the curriculum to start a session for this class.
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
              </>
            )}
          </div>

          {/* Roster + Poll */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

            {/* Roster */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                <div className="eyebrow">Student Roster</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-faint)', marginTop: '0.25rem' }}>
                  {students.filter(s => s.responded).length} of {students.length} responded
                </div>
              </div>
              {students.length === 0 ? (
                <div style={{ padding: '1.25rem', fontSize: '0.875rem', color: 'var(--text-faint)', textAlign: 'center' }}>
                  No students enrolled yet.
                </div>
              ) : (
                students.map((s) => (
                  <div key={s.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.7rem 1.25rem',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{s.name}</span>
                    <span style={{
                      fontSize: '0.68rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      padding: '0.22rem 0.65rem',
                      borderRadius: '999px',
                      background: s.responded ? 'rgba(106,191,123,0.12)' : 'var(--bg2)',
                      color: s.responded ? '#4a8a5a' : 'var(--text-faint)',
                    }}>
                      {s.responded ? 'Responded' : 'Waiting'}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Poll Results */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem 1.5rem' }}>
              <div className="eyebrow" style={{ marginBottom: '0.25rem' }}>Poll Results</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-faint)', marginBottom: '1.25rem' }}>
                {totalResponses} {totalResponses === 1 ? 'response' : 'responses'}
              </div>
              {pollResults.length === 0 ? (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-faint)' }}>
                  No poll data yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {pollResults.map((r) => {
                    const pct = totalResponses > 0 ? Math.round((r.count / totalResponses) * 100) : 0
                    return (
                      <div key={r.option_id}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '0.35rem',
                          fontSize: '0.85rem',
                        }}>
                          <span style={{ color: 'var(--text)' }}>{r.option_text}</span>
                          <span style={{ color: 'var(--text-dim)', fontWeight: 600, marginLeft: '0.75rem' }}>
                            {pct}% <span style={{ color: 'var(--text-faint)', fontWeight: 400, fontSize: '0.78rem' }}>({r.count})</span>
                          </span>
                        </div>
                        <div style={{
                          height: '8px',
                          background: 'var(--bg2)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: 'var(--gold)',
                            transition: 'width 0.3s',
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  )
}