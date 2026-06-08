import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getLessonContentHtml } from '@/lib/lesson-content'
import type { LessonMeta, LessonTeacherNotes, QuadrantActivity } from '@/lib/lesson-meta-types'
import type { U1L2ActivityData } from '@/content/lessons/u1-l2.meta'
import type { U1L3ActivityData } from '@/content/lessons/u1-l3.meta'
import type { U1L4ActivityData } from '@/content/lessons/u1-l4.meta'
import type { U1L5ActivityData } from '@/content/lessons/u1-l5.meta'
import type { U1L6ActivityData } from '@/content/lessons/u1-l6.meta'
import type { U1L7ActivityData } from '@/content/lessons/u1-l7.meta'

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
          {teacher && (
            <p style={{
              fontSize: '0.9rem',
              fontStyle: 'italic',
              color: 'var(--teacher)',
              background: 'var(--teacher-bg)',
              border: '1px solid var(--teacher-border)',
              borderRadius: '8px',
              padding: '0.8rem 1.1rem',
              marginTop: '1.25rem',
              maxWidth: '42rem',
            }}>
              Suggestions while you run the program.
            </p>
          )}
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
                <span className="prep-teacher-flag">About the Activity</span>
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

{meta.activity.type === 'custom' && slug === 'u1-l2' && (
                  <U1L2ScenariosPreview data={meta.activity.data as U1L2ActivityData} />
                )}

{meta.activity.type === 'custom' && slug === 'u1-l3' && (
                  <U1L3ClaimsPreview data={meta.activity.data as U1L3ActivityData} />
                )}

{meta.activity.type === 'custom' && slug === 'u1-l4' && (
                  <U1L4AuditPreview data={meta.activity.data as U1L4ActivityData} />
                )}

{meta.activity.type === 'custom' && slug === 'u1-l5' && (
                  <U1L5SteelmanPreview data={meta.activity.data as U1L5ActivityData} />
                )}

{meta.activity.type === 'custom' && slug === 'u1-l6' && (
                  <U1L6DeliberationPreview data={meta.activity.data as U1L6ActivityData} />
                )}

                {meta.activity.type === 'custom' && slug === 'u1-l7' && (
                  <U1L7ReflectionPreview data={meta.activity.data as U1L7ActivityData} />
                )}
              </div>
            )}

            {teacher?.activity?.callOnScripts && teacher.activity.callOnScripts.length > 0 && (
              <div className="prep-teacher-block">
              <span className="prep-teacher-flag">If you want to call on someone</span>
              <p>
                Prompts you could use if you&apos;d like to draw students out.
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
              <span className="prep-teacher-flag">One way to close</span>
              <p>If you&apos;d like to wrap up this way, adapt it to what your class actually shows m:</p>
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
                <span className="prep-teacher-flag">Worth a heads-up</span>
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

function U1L2ScenariosPreview({ data }: { data: U1L2ActivityData }) {
    return (
      <div style={{ marginTop: '1.5rem' }}>
        <div style={scenariosLabelStyle}>
          Tension: <strong>{data.tension}</strong> · {data.scenarios.length} scenarios
        </div>
        {data.scenarios.map((s, i) => (
          <div
            key={s.key}
            style={{
              ...scenarioCardStyle,
              marginBottom: i === data.scenarios.length - 1 ? 0 : '1.2rem',
            }}
          >
            <div style={scenarioHeadStyle}>
              <span style={scenarioNumStyle}>Scenario {s.index}</span>
              <h4 style={scenarioTitleStyle}>{s.title.replace(/^Scenario \d+\s*—\s*/, '')}</h4>
            </div>
            {s.prompt && (
              <div style={scenarioPromptStyle}>{s.prompt}</div>
            )}
            <div style={polesStyle}>
              <div style={poleStyle}>
                <div style={{ ...poleSideStyle, color: 'var(--gold)' }}>Liberty end</div>
                <div style={poleLabelStyle}>{s.libertyEnd.label}</div>
                <div style={poleArgStyle}>{s.libertyEnd.valueArgument}</div>
              </div>
              <div style={poleStyle}>
                <div style={{ ...poleSideStyle, color: '#2980b9' }}>Equality end</div>
                <div style={poleLabelStyle}>{s.equalityEnd.label}</div>
                <div style={poleArgStyle}>{s.equalityEnd.valueArgument}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  function U1L3ClaimsPreview({ data }: { data: U1L3ActivityData }) {
    return (
      <div style={{ marginTop: '1.5rem' }}>
        <div style={u1l3PrepLabelStyle}>
          Pair worksheet · {data.claims.length} claims · Answer key reveal at end
        </div>
        {data.claims.map((c, i) => (
          <div
            key={c.key}
            style={{
              ...u1l3PrepCardStyle,
              marginBottom: i === data.claims.length - 1 ? 0 : '1rem',
            }}
          >
            <div style={u1l3PrepClaimHeadStyle}>
              <span style={u1l3PrepClaimNumStyle}>Claim {c.index}</span>
              <div style={u1l3PrepClaimTextStyle}>{c.claim}</div>
            </div>
            <div style={u1l3PrepThreadsStyle}>
              <div style={u1l3PrepThreadBoxStyle}>
                <div style={{ ...u1l3PrepThreadSideStyle, color: 'var(--gold)' }}>Empirical (answer key)</div>
                <div style={u1l3PrepThreadTextStyle}>{c.answerKey.empirical}</div>
              </div>
              <div style={u1l3PrepThreadBoxStyle}>
                <div style={{ ...u1l3PrepThreadSideStyle, color: '#2980b9' }}>Normative (answer key)</div>
                <div style={u1l3PrepThreadTextStyle}>{c.answerKey.normative}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  const u1l3PrepLabelStyle: React.CSSProperties = {
    fontSize: '0.82rem',
    color: 'var(--text-faint)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '1rem',
  }
  
  const u1l3PrepCardStyle: React.CSSProperties = {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '1.4rem 1.6rem',
  }
  
  const u1l3PrepClaimHeadStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.85rem',
    marginBottom: '0.85rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--border)',
  }
  
  const u1l3PrepClaimNumStyle: React.CSSProperties = {
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#2980b9',
    background: 'rgba(41, 128, 185, 0.08)',
    padding: '0.25rem 0.55rem',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
  }
  
  const u1l3PrepClaimTextStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem',
    color: 'var(--text)',
    lineHeight: 1.3,
  }
  
  const u1l3PrepThreadsStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  }
  
  const u1l3PrepThreadBoxStyle: React.CSSProperties = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '0.85rem 1rem',
  }
  
  const u1l3PrepThreadSideStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '0.45rem',
  }
  
  const u1l3PrepThreadTextStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    color: 'var(--text-dim)',
    lineHeight: 1.55,
  }
  
  const scenariosLabelStyle: React.CSSProperties = {
    fontSize: '0.82rem',
    color: 'var(--text-faint)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '1rem',
  }
  
  const scenarioCardStyle: React.CSSProperties = {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '1.4rem 1.6rem',
  }
  
  const scenarioHeadStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.85rem',
    marginBottom: '0.85rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--border)',
  }
  
  const scenarioNumStyle: React.CSSProperties = {
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#2980b9',
    background: 'rgba(41, 128, 185, 0.08)',
    padding: '0.25rem 0.55rem',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
  }
  
  const scenarioTitleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem',
    color: 'var(--text)',
    margin: 0,
    lineHeight: 1.3,
  }
  
  const scenarioPromptStyle: React.CSSProperties = {
    fontSize: '0.92rem',
    color: 'var(--text-dim)',
    lineHeight: 1.55,
    marginBottom: '1rem',
    padding: '0.6rem 0.85rem',
    borderLeft: '3px solid var(--border)',
    background: 'var(--bg)',
    borderRadius: '0 4px 4px 0',
  }
  
  const polesStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  }
  
  const poleStyle: React.CSSProperties = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '0.9rem 1rem',
  }
  
  const poleSideStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '0.45rem',
  }
  
  const poleLabelStyle: React.CSSProperties = {
    fontWeight: 600,
    fontSize: '0.95rem',
    color: 'var(--text)',
    lineHeight: 1.35,
    marginBottom: '0.55rem',
  }
  
  const poleArgStyle: React.CSSProperties = {
    fontSize: '0.86rem',
    color: 'var(--text-dim)',
    lineHeight: 1.6,
  }

  function U1L4AuditPreview({ data }: { data: U1L4ActivityData }) {
    return (
      <div style={{ marginTop: '1.5rem' }}>
        <div style={u1l4PrepLabelStyle}>
          Side-pick + self-audit · 4 phases (Pick · Audit · Share-out · Reveal key)
        </div>

        {/* The two arguments */}
        {data.arguments.map((arg, i) => (
          <div
            key={arg.side}
            style={{
              ...u1l4PrepArgCardStyle,
              marginBottom: '1rem',
            }}
          >
            <div style={u1l4PrepArgHeadStyle}>
              <span style={u1l4PrepArgBadgeStyle}>Argument {arg.side}</span>
              <div style={u1l4PrepArgLabelStyle}>{arg.label}</div>
            </div>
            <p style={u1l4PrepArgBodyStyle}>{arg.body}</p>
          </div>
        ))}

        {/* The answer keys */}
        <div style={{ ...u1l4PrepLabelStyle, marginTop: '1.5rem' }}>
          Answer key — for the reveal phase
        </div>

        {data.answerKey.map(entry => (
          <div key={entry.side} style={u1l4PrepKeyCardStyle}>
            <div style={u1l4PrepKeyHeadStyle}>
              <span style={u1l4PrepArgBadgeStyle}>Argument {entry.side}</span>
              <span style={u1l4PrepKeyMetaStyle}>
                {entry.strengths.length} strengths · {entry.weaknesses.length} weaknesses
              </span>
            </div>

            <div style={u1l4PrepKeyGroupLabelStyle}>What it does well</div>
            {entry.strengths.map((s, i) => (
              <div key={`s-${i}`} style={u1l4PrepKeyEntryStyle}>
                <strong>{s.title}</strong> {s.body}
              </div>
            ))}

            <div style={{ ...u1l4PrepKeyGroupLabelStyle, marginTop: '0.85rem' }}>
              What it lacks or smooths over
            </div>
            {entry.weaknesses.map((w, i) => (
              <div key={`w-${i}`} style={u1l4PrepKeyEntryStyle}>
                <strong>{w.title}</strong> {w.body}
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  const u1l4PrepLabelStyle: React.CSSProperties = {
    fontSize: '0.82rem',
    color: 'var(--text-faint)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '1rem',
  }

  const u1l4PrepArgCardStyle: React.CSSProperties = {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '1.4rem 1.6rem',
  }

  const u1l4PrepArgHeadStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.85rem',
    marginBottom: '0.9rem',
    paddingBottom: '0.7rem',
    borderBottom: '1px solid var(--border)',
    flexWrap: 'wrap',
  }

  const u1l4PrepArgBadgeStyle: React.CSSProperties = {
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#2980b9',
    background: 'rgba(41, 128, 185, 0.08)',
    padding: '0.25rem 0.55rem',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
  }

  const u1l4PrepArgLabelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem',
    color: 'var(--text)',
    lineHeight: 1.3,
  }

  const u1l4PrepArgBodyStyle: React.CSSProperties = {
    fontSize: '0.92rem',
    color: 'var(--text-dim)',
    lineHeight: 1.65,
    margin: 0,
  }

  const u1l4PrepKeyCardStyle: React.CSSProperties = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderLeft: '3px solid var(--gold)',
    borderRadius: '0 8px 8px 0',
    padding: '1.2rem 1.4rem',
    marginBottom: '1rem',
  }

  const u1l4PrepKeyHeadStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    marginBottom: '0.8rem',
    paddingBottom: '0.6rem',
    borderBottom: '1px solid var(--border)',
    flexWrap: 'wrap',
  }

  const u1l4PrepKeyMetaStyle: React.CSSProperties = {
    fontSize: '0.78rem',
    color: 'var(--text-faint)',
  }

  const u1l4PrepKeyGroupLabelStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--gold)',
    marginBottom: '0.5rem',
  }

  const u1l4PrepKeyEntryStyle: React.CSSProperties = {
    fontSize: '0.88rem',
    color: 'var(--text-dim)',
    lineHeight: 1.55,
    marginBottom: '0.5rem',
  }

  function U1L5SteelmanPreview({ data }: { data: U1L5ActivityData }) {
    return (
      <div style={{ marginTop: '1.5rem' }}>
        <div style={u1l5PrepLabelStyle}>
          Side pick + steelman the opposite · 4 phases (Pick · Read &amp; write · Pair share · Closing) · Verbal pairing
        </div>

        {/* The tension and poll question */}
        <div style={u1l5PrepTensionCardStyle}>
          <div style={u1l5PrepTensionFlagStyle}>Six Tensions · {data.tension}</div>
          <div style={u1l5PrepTensionQStyle}>{data.pollQuestion}</div>
        </div>

        {/* The two cases */}
        <div style={u1l5PrepCasesLabelStyle}>The two cases students choose between</div>
        {data.cases.map(c => (
          <div key={c.side} style={u1l5PrepCaseCardStyle}>
            <div style={u1l5PrepCaseHeadStyle}>
              <span style={u1l5PrepCaseBadgeStyle}>
                {c.side === 'federal' ? 'Federal' : 'State'}
              </span>
              <h4 style={u1l5PrepCaseTitleStyle}>{c.label}</h4>
            </div>
            {c.body.split(/\n\n+/).map((p, i) => (
              <p key={i} style={u1l5PrepCaseParaStyle}>{p.trim()}</p>
            ))}
          </div>
        ))}

        {/* Pair share prompts */}
        <div style={u1l5PrepPairBoxStyle}>
          <div style={u1l5PrepPairLabelStyle}>Pair share prompts</div>
          <ol style={u1l5PrepPairListStyle}>
            {data.pairSharePrompts.map((p, i) => (
              <li key={i} style={u1l5PrepPairItemStyle}>{p}</li>
            ))}
          </ol>
        </div>
      </div>
    )
  }

  const u1l5PrepLabelStyle: React.CSSProperties = {
    fontSize: '0.82rem',
    color: 'var(--text-faint)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '1rem',
  }

  const u1l5PrepTensionCardStyle: React.CSSProperties = {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderLeft: '3px solid var(--gold)',
    borderRadius: '0 8px 8px 0',
    padding: '1.1rem 1.4rem',
    marginBottom: '1.5rem',
  }

  const u1l5PrepTensionFlagStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--gold)',
    marginBottom: '0.55rem',
  }

  const u1l5PrepTensionQStyle: React.CSSProperties = {
    fontSize: '0.95rem',
    color: 'var(--text)',
    lineHeight: 1.6,
  }

  const u1l5PrepCasesLabelStyle: React.CSSProperties = {
    fontSize: '0.82rem',
    color: 'var(--text-faint)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.85rem',
  }

  const u1l5PrepCaseCardStyle: React.CSSProperties = {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '1.4rem 1.6rem',
    marginBottom: '1rem',
  }

  const u1l5PrepCaseHeadStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.85rem',
    marginBottom: '0.9rem',
    paddingBottom: '0.7rem',
    borderBottom: '1px solid var(--border)',
    flexWrap: 'wrap',
  }

  const u1l5PrepCaseBadgeStyle: React.CSSProperties = {
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#2980b9',
    background: 'rgba(41, 128, 185, 0.08)',
    padding: '0.25rem 0.55rem',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
  }

  const u1l5PrepCaseTitleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem',
    color: 'var(--text)',
    margin: 0,
    lineHeight: 1.3,
  }

  const u1l5PrepCaseParaStyle: React.CSSProperties = {
    fontSize: '0.88rem',
    color: 'var(--text-dim)',
    lineHeight: 1.65,
    margin: '0 0 0.65rem',
  }

  const u1l5PrepPairBoxStyle: React.CSSProperties = {
    marginTop: '1.5rem',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderLeft: '3px solid var(--gold)',
    borderRadius: '0 8px 8px 0',
    padding: '1.2rem 1.4rem',
  }

  const u1l5PrepPairLabelStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--gold)',
    marginBottom: '0.7rem',
  }

  const u1l5PrepPairListStyle: React.CSSProperties = {
    margin: 0,
    paddingLeft: '1.3rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  }

  const u1l5PrepPairItemStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: 'var(--text)',
    lineHeight: 1.55,
  }

  function U1L6DeliberationPreview({ data }: { data: U1L6ActivityData }) {
    return (
      <div style={{ marginTop: '1.5rem' }}>
        <div style={u1l6PrepLabelStyle}>
          Assigned-side deliberation · Prep + 5 rounds + closing · Sides assigned by count-off (not chosen)
        </div>

        {/* Tension + question */}
        <div style={u1l6PrepTensionCardStyle}>
          <div style={u1l6PrepTensionFlagStyle}>Six Tensions · {data.tension}</div>
          <div style={u1l6PrepTensionQStyle}>{data.question}</div>
          <div style={u1l6PrepSidesRowStyle}>
            <span style={u1l6PrepSideTagStyle}>YES — {data.sideLabels.yes}</span>
            <span style={u1l6PrepSideTagStyle}>NO — {data.sideLabels.no}</span>
          </div>
        </div>

        {/* Round sequence */}
        <div style={u1l6PrepRoundsLabelStyle}>The five debate rounds (you advance them)</div>
        {data.rounds.map((r, i) => (
          <div key={r.step} style={u1l6PrepRoundCardStyle}>
            <div style={u1l6PrepRoundHeadStyle}>
              <span style={u1l6PrepRoundNumStyle}>Round {i + 1}</span>
              <h4 style={u1l6PrepRoundTitleStyle}>{r.headline}</h4>
            </div>
            <p style={u1l6PrepRoundInstrStyle}>{r.instruction}</p>
          </div>
        ))}

        {/* Closing questions */}
        <div style={u1l6PrepClosingBoxStyle}>
          <div style={u1l6PrepClosingLabelStyle}>Closing questions</div>
          <ol style={u1l6PrepClosingListStyle}>
            {data.closingQuestions.map((q, i) => (
              <li key={i} style={u1l6PrepClosingItemStyle}>{q}</li>
            ))}
          </ol>
        </div>
      </div>
    )
  }

  const u1l6PrepLabelStyle: React.CSSProperties = {
    fontSize: '0.82rem',
    color: 'var(--text-faint)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '1rem',
  }

  const u1l6PrepTensionCardStyle: React.CSSProperties = {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderLeft: '3px solid var(--gold)',
    borderRadius: '0 8px 8px 0',
    padding: '1.1rem 1.4rem',
    marginBottom: '1.5rem',
  }

  const u1l6PrepTensionFlagStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--gold)',
    marginBottom: '0.55rem',
  }

  const u1l6PrepTensionQStyle: React.CSSProperties = {
    fontSize: '0.95rem',
    color: 'var(--text)',
    lineHeight: 1.6,
    marginBottom: '0.9rem',
  }

  const u1l6PrepSidesRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.6rem',
    flexWrap: 'wrap',
  }

  const u1l6PrepSideTagStyle: React.CSSProperties = {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-dim)',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '0.35rem 0.7rem',
  }

  const u1l6PrepRoundsLabelStyle: React.CSSProperties = {
    fontSize: '0.82rem',
    color: 'var(--text-faint)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.85rem',
  }

  const u1l6PrepRoundCardStyle: React.CSSProperties = {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '1.1rem 1.4rem',
    marginBottom: '0.85rem',
  }

  const u1l6PrepRoundHeadStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.85rem',
    marginBottom: '0.55rem',
    flexWrap: 'wrap',
  }

  const u1l6PrepRoundNumStyle: React.CSSProperties = {
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#2980b9',
    background: 'rgba(41, 128, 185, 0.08)',
    padding: '0.25rem 0.55rem',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
  }

  const u1l6PrepRoundTitleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem',
    color: 'var(--text)',
    margin: 0,
    lineHeight: 1.3,
  }

  const u1l6PrepRoundInstrStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: 'var(--text-dim)',
    lineHeight: 1.6,
    margin: 0,
  }

  const u1l6PrepClosingBoxStyle: React.CSSProperties = {
    marginTop: '1.5rem',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderLeft: '3px solid var(--gold)',
    borderRadius: '0 8px 8px 0',
    padding: '1.2rem 1.4rem',
  }

  const u1l6PrepClosingLabelStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--gold)',
    marginBottom: '0.7rem',
  }

  const u1l6PrepClosingListStyle: React.CSSProperties = {
    margin: 0,
    paddingLeft: '1.3rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  }

  const u1l6PrepClosingItemStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: 'var(--text)',
    lineHeight: 1.55,
  }

  function U1L7ReflectionPreview({ data }: { data: U1L7ActivityData }) {
    return (
      <div style={{ marginTop: '1.5rem' }}>
        <div style={u1l7PrepLabelStyle}>
          Unit capstone reflection · No interactive activity · Static recap + written Ledger
        </div>

        <div style={u1l7PrepCapabilityCardStyle}>
          <div style={u1l7PrepCapabilityFlagStyle}>What this unit was for</div>
          <div style={u1l7PrepCapabilityTextStyle}>{data.capability}</div>
        </div>

        <div style={u1l7PrepToolsLabelStyle}>The four tools (recap shown to students)</div>
        {data.tools.map((tool, i) => (
          <div key={i} style={u1l7PrepToolCardStyle}>
            <div style={u1l7PrepToolHeadStyle}>
              <span style={u1l7PrepToolNumStyle}>{i + 1}</span>
              <div>
                <div style={u1l7PrepToolNameStyle}>{tool.name}</div>
                <div style={u1l7PrepToolFullNameStyle}>{tool.fullName}</div>
              </div>
            </div>
            <p style={u1l7PrepToolTakeawayStyle}>{tool.takeaway}</p>
            <div style={u1l7PrepToolPracticedStyle}>
              <strong>Practiced in:</strong> {tool.practicedIn}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const u1l7PrepLabelStyle: React.CSSProperties = {
    fontSize: '0.82rem',
    color: 'var(--text-faint)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '1rem',
  }

  const u1l7PrepCapabilityCardStyle: React.CSSProperties = {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderLeft: '3px solid var(--gold)',
    borderRadius: '0 8px 8px 0',
    padding: '1.1rem 1.4rem',
    marginBottom: '1.5rem',
  }

  const u1l7PrepCapabilityFlagStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--gold)',
    marginBottom: '0.55rem',
  }

  const u1l7PrepCapabilityTextStyle: React.CSSProperties = {
    fontSize: '0.95rem',
    color: 'var(--text)',
    lineHeight: 1.6,
  }

  const u1l7PrepToolsLabelStyle: React.CSSProperties = {
    fontSize: '0.82rem',
    color: 'var(--text-faint)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.85rem',
  }

  const u1l7PrepToolCardStyle: React.CSSProperties = {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '1.3rem 1.5rem',
    marginBottom: '0.85rem',
  }

  const u1l7PrepToolHeadStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.85rem',
    marginBottom: '0.8rem',
  }

  const u1l7PrepToolNumStyle: React.CSSProperties = {
    flexShrink: 0,
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    color: 'var(--gold)',
    lineHeight: 1,
    minWidth: '1.8rem',
  }

  const u1l7PrepToolNameStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: '1.15rem',
    color: 'var(--text)',
    lineHeight: 1.2,
    marginBottom: '0.2rem',
  }

  const u1l7PrepToolFullNameStyle: React.CSSProperties = {
    fontSize: '0.82rem',
    color: 'var(--text-faint)',
    lineHeight: 1.4,
  }

  const u1l7PrepToolTakeawayStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: 'var(--text)',
    lineHeight: 1.6,
    margin: '0 0 0.9rem',
  }

  const u1l7PrepToolPracticedStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    color: 'var(--text-dim)',
    lineHeight: 1.5,
    paddingTop: '0.8rem',
    borderTop: '1px dashed var(--border)',
  }