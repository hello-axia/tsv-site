import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getLessonContentHtml } from '@/lib/lesson-content'
import type { LessonMeta, LessonTeacherNotes, QuadrantActivity } from '@/lib/lesson-meta-types'

const LESSON_TYPE_LABELS: Record<string, string> = {
  briefing: 'Briefing',
  artifact_analysis: 'Artifact Analysis',
  deliberation: 'Deliberation',
  civic_action: 'Civic Action',
  reflection: 'Reflection',
  reflection_sharing: 'Reflection Sharing',
}

async function loadLessonMeta(slug: string): Promise<LessonMeta | null> {
  try {
    const mod = await import(`@/content/lessons/${slug}.meta`)
    return (mod.meta ?? null) as LessonMeta | null
  } catch {
    return null
  }
}

async function loadTeacherNotes(slug: string): Promise<LessonTeacherNotes | null> {
  try {
    const mod = await import(`@/content/lessons/${slug}.teacher`)
    return (mod.teacherNotes ?? null) as LessonTeacherNotes | null
  } catch {
    return null
  }
}

export default async function LessonPrepPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Lookup the lesson row by slug.
  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, slug, title, unit, lesson_number, lesson_type, status')
    .eq('slug', slug)
    .single()

  if (!lesson) notFound()

  const briefingHtml = getLessonContentHtml(slug)
  const meta = await loadLessonMeta(slug)
  const teacher = await loadTeacherNotes(slug)

  const lessonTypeLabel = LESSON_TYPE_LABELS[lesson.lesson_type] ?? lesson.lesson_type
  const isPublished = lesson.status === 'published'

  return (
    <main style={{ flex: 1 }}>
      <div className="prep-shell">

        {/* Breadcrumb */}
        <div style={{ fontSize: '0.82rem', color: 'var(--text-faint)', marginBottom: '1.5rem' }}>
          <a href="/curriculum" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>← Curriculum</a>
          <span style={{ margin: '0 0.5rem' }}>·</span>
          <span>Unit {lesson.unit}, Lesson {lesson.lesson_number}</span>
        </div>

        {/* Lesson header */}
        <div className="prep-head">
          <div className="prep-tags">
            <span className="prep-tag prep-tag-type">{lessonTypeLabel}</span>
            <span className="prep-tag prep-tag-unit">Unit {lesson.unit} · Lesson {lesson.lesson_number}</span>
            {teacher?.estimatedMinutes && (
              <span className="prep-tag prep-tag-time">~{teacher.estimatedMinutes} min</span>
            )}
            {!isPublished && (
              <span className="prep-tag prep-tag-unit">Draft</span>
            )}
          </div>
          <h1>{lesson.title}</h1>
          {teacher?.summary && <p className="prep-summary">{teacher.summary}</p>}
        </div>

        {/* === STAGE 1: BRIEFING === */}
        <div className="prep-section-label">
          <span className="prep-sl-num">01</span>
          <span className="prep-sl-text">The Briefing</span>
          <span className="prep-sl-rule" />
        </div>

        {teacher?.briefing?.notes && (
          <div className="prep-teacher-block">
            <span className="prep-teacher-flag">Teacher context</span>
            <div dangerouslySetInnerHTML={{ __html: teacher.briefing.notes }} />
          </div>
        )}

        <div className="prep-student-block">
          <span className="prep-block-flag">Student-facing · reading</span>
          {briefingHtml ? (
            <div className="lesson-reading" dangerouslySetInnerHTML={{ __html: briefingHtml }} />
          ) : (
            <p style={{ color: 'var(--text-faint)' }}>No briefing content authored yet.</p>
          )}
        </div>

        {/* === STAGE 2: ACTIVITY === */}
        {meta?.activity && (
          <>
            <div className="prep-section-label">
              <span className="prep-sl-num">02</span>
              <span className="prep-sl-text">
                The Activity{meta.activity.type === 'quadrant' ? ' — Where Do You Stand?' : ''}
              </span>
              <span className="prep-sl-rule" />
            </div>

            {teacher?.activity?.guide && (
              <div className="prep-teacher-block">
                <span className="prep-teacher-flag">For the teacher — activity guide</span>
                <h3>Apply: Where Do You Stand?</h3>
                <div className="prep-activity-meta">
                  <div className="prep-meta-item">
                    <div className="prep-mi-label">Activity type</div>
                    <div className="prep-mi-value">{prettyActivityType(meta.activity.type)}</div>
                  </div>
                  <div className="prep-meta-item">
                    <div className="prep-mi-label">Format</div>
                    <div className="prep-mi-value">Whole class · projector</div>
                  </div>
                </div>
                <div dangerouslySetInnerHTML={{ __html: teacher.activity.guide }} />

                {meta.activity.type === 'quadrant' && (
                  <QuadrantPreview spec={meta.activity} />
                )}
              </div>
            )}

            {teacher?.activity?.callOnScripts && teacher.activity.callOnScripts.length > 0 && (
              <div className="prep-teacher-block">
                <span className="prep-teacher-flag">Teacher script — calling on students</span>
                <p>
                  Call on one student per populated quadrant, using the question that matches their
                  quadrant. If a quadrant is empty, skip it. If one is heavily populated, call on two.
                </p>
                <div className="prep-script-list">
                  {teacher.activity.callOnScripts.map((s, i) => (
                    <div key={i} className="prep-script-row">
                      <div className="prep-sr-target">{s.target}</div>
                      <div className="prep-sr-line">{s.line}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {teacher?.activity?.closingScript && (
              <div className="prep-teacher-block">
                <span className="prep-teacher-flag">Teacher script — closing the activity</span>
                <p>Adapt to what your class&apos;s distribution actually shows. Fill in your room&apos;s real numbers:</p>
                <div className="prep-script-spoken">
                  <div className="prep-ss-label">{teacher.activity.closingScript.label}</div>
                  {teacher.activity.closingScript.lines.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            )}

            {teacher?.activity?.facilitationNotes && teacher.activity.facilitationNotes.length > 0 && (
              <div className="prep-teacher-block">
                <span className="prep-teacher-flag">Facilitation notes</span>
                <div className="prep-notes-list">
                  {teacher.activity.facilitationNotes.map((n, i) => (
                    <div key={i} className="prep-note-item">
                      <span><strong>{n.title}</strong> {n.body}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* === STAGE 3: LEDGER === */}
        {meta?.ledger && (
          <>
            <div className="prep-section-label">
              <span className="prep-sl-num">03</span>
              <span className="prep-sl-text">The Ledger Entry</span>
              <span className="prep-sl-rule" />
            </div>

            {teacher?.ledger?.intro && (
              <div className="prep-teacher-block" style={{ marginBottom: '1.2rem' }}>
                <span className="prep-teacher-flag">About this entry</span>
                <div dangerouslySetInnerHTML={{ __html: teacher.ledger.intro }} />
              </div>
            )}

            <div className="prep-ledger-card">
              <div className="prep-ledger-head">
                <span className="prep-lh-title">Civic Journal — Entry</span>
                <span className="prep-lh-meta">Tier {meta.ledger.privacyTier}</span>
              </div>
              <div className="prep-ledger-body">
                {meta.ledger.mcQuestion && meta.ledger.mcOptions && (
                  <>
                    <div className="prep-ledger-q-label">Multiple choice — your position</div>
                    <div className="prep-ledger-question">{meta.ledger.mcQuestion}</div>
                    <div className="prep-ledger-options">
                      {meta.ledger.mcOptions.map((opt, i) => (
                        <div key={opt.key} className="prep-ledger-opt">
                          <span className="prep-opt-key">{String.fromCharCode(65 + i)}</span>
                          <span>{opt.label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="prep-ledger-written">
                  <div className="prep-lw-label">Written response</div>
                  <div className="prep-lw-prompt">{meta.ledger.writtenPrompt}</div>
                  <div className="prep-lw-field">Student types their response here — a few sentences.</div>
                </div>

                <div className="prep-tier-note">
                  <span>ⓘ</span>
                  <span>
                    <strong>Privacy — Tier {meta.ledger.privacyTier}.</strong>
                    {meta.ledger.privacyTier === 1
                      ? ' You confirm the entry is complete; you don\'t see its content. The written response is the student\'s own thinking.'
                      : ' You see both the entry\'s completion and its content.'}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Fallback message if no meta or teacher notes exist yet */}
        {!meta && !teacher && !briefingHtml && (
          <div style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            color: 'var(--text-faint)',
            border: '1px dashed var(--border)',
            borderRadius: '8px',
            marginTop: '2rem',
          }}>
            <p>No content authored for this lesson yet.</p>
          </div>
        )}
      </div>
    </main>
  )
}

function prettyActivityType(type: string): string {
  if (type === 'quadrant') return 'Anonymous quadrant placement, live distribution'
  if (type === 'mc') return 'Multiple choice poll, live distribution'
  if (type === 'custom') return 'Custom in-room activity'
  return type
}

function QuadrantPreview({ spec }: { spec: QuadrantActivity }) {
  const cellByPosition: Record<string, string> = {
    tl: 'engaged_detached',
    tr: 'engaged_affected',
    bl: 'disengaged',
    br: 'affected_tuned_out',
  }
  const quadrantByKey: Record<string, { label: string; description?: string }> = {}
  for (const q of spec.quadrants) {
    quadrantByKey[q.key] = { label: q.label, description: q.description }
  }
  return (
    <div className="prep-quad-wrap">
      <div className="prep-quad-yaxis">{spec.yAxis} →</div>
      <div>
        <div className="prep-quad">
          {(['tl', 'tr', 'bl', 'br'] as const).map(pos => {
            const q = quadrantByKey[cellByPosition[pos]]
            return (
              <div key={pos} className={`prep-quad-cell ${pos}`}>
                <span className="prep-qc-name">{q?.label}</span>
                {q?.description && <span className="prep-qc-desc">{q.description}</span>}
              </div>
            )
          })}
        </div>
        <div className="prep-quad-xaxis">{spec.xAxis} →</div>
      </div>
    </div>
  )
}