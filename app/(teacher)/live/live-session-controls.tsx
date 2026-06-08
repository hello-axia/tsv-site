'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { LessonMeta, LessonTeacherNotes } from '@/lib/lesson-meta-types'
import QuadrantActivityComponent from '../../(student)/student/live/quadrant-activity'
import LedgerEntryComponent from '../../(student)/student/live/ledger-entry'
import U1L2TensionsActivity from '../../(student)/student/live/u1-l2-tensions-activity'
import U1L3ThreadsActivity from '../../(student)/student/live/u1-l3-threads-activity'
import U1L4AuditActivity from '../../(student)/student/live/u1-l4-audit-activity'
import U1L5SteelmanActivity from '../../(student)/student/live/u1-l5-steelman-activity'
import U1L6DeliberationActivity from '../../(student)/student/live/u1-l6-deliberation'
import U1L7ReflectionActivity from '../../(student)/student/live/u1-l7-reflection'
import type { U1L2ActivityData } from '@/content/lessons/u1-l2.meta'
import type { U1L3ActivityData } from '@/content/lessons/u1-l3.meta'
import type { U1L4ActivityData } from '@/content/lessons/u1-l4.meta'
import type { U1L5ActivityData } from '@/content/lessons/u1-l5.meta'
import type { U1L6ActivityData } from '@/content/lessons/u1-l6.meta'
import type { U1L7ActivityData } from '@/content/lessons/u1-l7.meta'

type StepKey = 'briefing' | 'activity' | 'ledger'
const STEP_ORDER: StepKey[] = ['briefing', 'activity', 'ledger']
const STEP_LABELS: Record<StepKey, string> = {
  briefing: 'Briefing',
  activity: 'Activity',
  ledger: 'Ledger',
}

export default function LiveSessionControls({
    assignmentId,
    lessonId,
    lessonSlug,
    lessonTitle,
    unit,
    lessonNumber,
    status: initialStatus,
    initialStep,
    briefingHtml,
    meta,
    profileId,
    classCode,
    teacher,
}: {
    assignmentId: string
    lessonId: string
    lessonSlug: string
    lessonTitle: string
    unit: number
    lessonNumber: number
    status: 'live' | 'paused'
    initialStep: string | null
    briefingHtml: string | null
    meta: LessonMeta | null
    profileId: string
    classCode: string | null
    teacher: LessonTeacherNotes | null
  }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState<string | null>(null)
  const [status, setStatus] = useState<'live' | 'paused'>(initialStatus)
  const [currentStep, setCurrentStep] = useState<StepKey>(((initialStep ?? 'briefing') as StepKey))
  // viewStep is what the teacher is previewing. Defaults to currentStep, auto-advances on unlock.
  const [viewStep, setViewStep] = useState<StepKey>(((initialStep ?? 'briefing') as StepKey))
  const [notesOpen, setNotesOpen] = useState(false)

  // Poll every 3s to stay in sync.
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    async function fetchState() {
      const { data } = await supabase
        .from('lesson_assignments')
        .select('status, current_step')
        .eq('id', assignmentId)
        .maybeSingle()
      if (cancelled || !data) return
      if (data.status === 'completed' || data.status === 'not_started') {
        startTransition(() => router.refresh())
        return
      }
      setStatus(data.status as 'live' | 'paused')
      setCurrentStep((data.current_step ?? 'briefing') as StepKey)
    }
    const id = setInterval(fetchState, 3000)
    return () => { cancelled = true; clearInterval(id) }
  }, [assignmentId, router])

  const currentIdx = STEP_ORDER.indexOf(currentStep)
  const nextStep: StepKey | null = currentIdx < STEP_ORDER.length - 1 ? STEP_ORDER[currentIdx + 1] : null
  const prevStep: StepKey | null = currentIdx > 0 ? STEP_ORDER[currentIdx - 1] : null

  async function setSessionStatus(newStatus: 'live' | 'paused', key: string) {
    if (loading) return
    setLoading(key)
    const supabase = createClient()
    const { error } = await supabase
      .from('lesson_assignments')
      .update({ status: newStatus })
      .eq('id', assignmentId)
    if (error) {
      alert(`Could not update. ${error.message}`)
      setLoading(null)
      return
    }
    setStatus(newStatus)
    setLoading(null)
  }

  async function unlock(next: StepKey) {
    if (loading) return
    setLoading('unlock')
    const supabase = createClient()
    const { error } = await supabase
      .from('lesson_assignments')
      .update({ current_step: next })
      .eq('id', assignmentId)
    if (error) {
      alert(`Could not unlock. ${error.message}`)
      setLoading(null)
      return
    }
    setCurrentStep(next)
    setViewStep(next) // auto-advance teacher view
    setLoading(null)
  }

  async function undoUnlock(prev: StepKey) {
    if (loading) return
    if (!confirm(`Undo? Students will return to ${STEP_LABELS[prev]}.`)) return
    setLoading('undo')
    const supabase = createClient()
    const { error } = await supabase
      .from('lesson_assignments')
      .update({ current_step: prev })
      .eq('id', assignmentId)
    if (error) {
      alert(`Could not undo. ${error.message}`)
      setLoading(null)
      return
    }
    setCurrentStep(prev)
    setViewStep(prev)
    setLoading(null)
  }

  async function markComplete() {
    if (loading) return
    if (!confirm('Mark this lesson complete? Students will return to "Waiting for your teacher."')) return
    setLoading('complete')
    const supabase = createClient()
    const { error } = await supabase
      .from('lesson_assignments')
      .update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('id', assignmentId)
    if (error) {
      alert(`Could not complete. ${error.message}`)
      setLoading(null)
      return
    }
    router.push('/curriculum')
  }

  const isLive = status === 'live'
  const viewIdx = STEP_ORDER.indexOf(viewStep)
  const viewIsLocked = viewIdx > currentIdx

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {/* ===== TOP PANEL (scrolls away) ===== */}
      <div>
        {/* Status header */}
        <div style={{
          background: isLive ? 'var(--gold-dim)' : 'var(--bg)',
          border: `1px solid ${isLive ? 'var(--gold)' : 'var(--border)'}`,
          borderRadius: '10px',
          padding: '1.1rem 1.4rem',
          marginBottom: '0.85rem',
        }}>
          <div style={{
            fontSize: '0.7rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: isLive ? 'var(--gold)' : 'var(--text-dim)',
            fontWeight: 600,
            marginBottom: '0.3rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}>
            {isLive && (
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--gold)',
                display: 'inline-block',
              }} />
            )}
            {isLive ? 'Live Now' : 'Paused'} · Class is on {STEP_LABELS[currentStep]}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.1rem' }}>
          Unit {unit} · Lesson {lessonNumber}
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--text)' }}>
            {lessonTitle}
          </div>
          {classCode && (
            <a
              href={`/broadcast/${classCode}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--gold)',
                textDecoration: 'none',
                padding: '0.45rem 0.85rem',
                background: 'var(--bg)',
                border: '1px solid var(--gold)',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              📺 Open broadcast for projector
            </a>
          )}
        </div>
      </div>

        {/* Step progress (clickable for teacher nav) */}
        <div style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '1rem 1.4rem',
          marginBottom: '0.85rem',
        }}>
          <div style={{
            fontSize: '0.66rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            fontWeight: 600,
            marginBottom: '0.75rem',
          }}>
            Lesson Flow · Click to preview
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {STEP_ORDER.map((s, i) => {
              const done = i < currentIdx
              const current = i === currentIdx
              const locked = i > currentIdx
              const viewing = s === viewStep
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <button
                    onClick={() => setViewStep(s)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      padding: '0.4rem 0.75rem 0.4rem 0.4rem',
                      borderRadius: '999px',
                      background: viewing ? 'var(--gold-dim)' : 'transparent',
                      border: `1px solid ${viewing ? 'var(--gold)' : 'transparent'}`,
                      cursor: 'pointer',
                      font: 'inherit',
                    }}
                  >
                    <span style={{
                      width: '1.7rem',
                      height: '1.7rem',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.85rem',
                      background: done ? '#2f5d62' : current ? 'var(--gold)' : 'var(--bg2)',
                      color: done || current ? '#fff' : 'var(--text-faint)',
                      border: `1px solid ${done ? '#2f5d62' : current ? 'var(--gold)' : 'var(--border)'}`,
                    }}>
                      {done ? '✓' : locked ? '🔒' : i + 1}
                    </span>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: done ? 'var(--text-dim)' : current ? 'var(--text)' : 'var(--text-faint)',
                    }}>
                      {STEP_LABELS[s]}
                    </span>
                  </button>
                  {i < STEP_ORDER.length - 1 && (
                    <span style={{ width: '1.1rem', height: '2px', background: 'var(--border)' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ===== STICKY ACTION BAR (sticks to top on scroll) ===== */}
      <div style={{
        position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'var(--bg2)',
          paddingTop: '0.5rem',
          paddingBottom: '0.5rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '0.85rem 1.4rem',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              fontSize: '0.7rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-faint)',
              fontWeight: 600,
              marginRight: '0.4rem',
            }}>
              On {STEP_LABELS[currentStep]}
            </div>
            <button
              onClick={() => setNotesOpen(true)}
              style={notesBtnStyle}
              title="Show teacher notes for this step"
            >
              📋 Teacher Notes
            </button>
            {isLive ? (
              <button onClick={() => setSessionStatus('paused', 'pause')} disabled={!!loading || isPending} style={secondaryBtn(loading)}>
                {loading === 'pause' ? 'Pausing…' : 'Pause'}
              </button>
            ) : (
              <button onClick={() => setSessionStatus('live', 'resume')} disabled={!!loading || isPending} style={secondaryBtn(loading)}>
                {loading === 'resume' ? 'Resuming…' : 'Resume'}
              </button>
            )}

            {prevStep && isLive && (
              <button onClick={() => undoUnlock(prevStep)} disabled={!!loading || isPending} style={undoBtn(loading)}>
                {loading === 'undo' ? 'Undoing…' : `↺ Undo`}
              </button>
            )}

            {nextStep && isLive && (
              <button onClick={() => unlock(nextStep)} disabled={!!loading || isPending} style={primaryBtn(loading)}>
                {loading === 'unlock' ? 'Unlocking…' : `Unlock ${STEP_LABELS[nextStep]} →`}
              </button>
            )}

            <div style={{ flex: 1 }} />

            <button onClick={markComplete} disabled={!!loading || isPending} style={completeBtn(loading)}>
              {loading === 'complete' ? 'Marking…' : 'Mark Complete'}
              </button>
          </div>
        </div>

      {/* ===== MIRRORED STUDENT CONTENT ===== */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '0.85rem',
          flexWrap: 'wrap',
        }}>
          <div style={{
            fontSize: '0.7rem',
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span style={{ width: '1.7rem', height: '1px', background: 'var(--gold)' }} />
            {viewIsLocked
              ? `Previewing ${STEP_LABELS[viewStep]} — not yet released to class`
              : viewStep === currentStep
                ? `What the class is seeing — ${STEP_LABELS[viewStep]}`
                : `${STEP_LABELS[viewStep]} — already released`}
          </div>
          {viewIsLocked && (
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              padding: '0.3rem 0.6rem',
              borderRadius: '4px',
            }}>
              🔒 Locked to class
            </span>
          )}
        </div>

        <StepContent
          step={viewStep}
          briefingHtml={briefingHtml}
          meta={meta}
          assignmentId={assignmentId}
          lessonId={lessonId}
          profileId={profileId}
          lessonSlug={lessonSlug}
        />
      </div>

      {/* ===== TEACHER NOTES SIDE PANEL ===== */}
      {notesOpen && (
        <TeacherNotesPanel
          step={viewStep}
          teacher={teacher}
          onClose={() => setNotesOpen(false)}
        />
      )}
    </div>
  )
}

function StepContent({
    step,
    briefingHtml,
    meta,
    assignmentId,
    lessonId,
    profileId,
    lessonSlug,
  }: {
    step: StepKey
    briefingHtml: string | null
    meta: LessonMeta | null
    assignmentId: string
    lessonId: string
    profileId: string
    lessonSlug: string
  }) {
    if (step === 'briefing') {
      return briefingHtml
        ? <div className="lesson-reading" dangerouslySetInnerHTML={{ __html: briefingHtml }} />
        : <div className="lesson-reading"><p style={{ color: 'var(--text-faint)' }}>(No briefing content for this lesson yet.)</p></div>
    }
    if (step === 'activity') {
        if (meta?.activity?.type === 'quadrant') {
          return (
            <QuadrantActivityComponent
              assignmentId={assignmentId}
              lessonId={lessonId}
              profileId={profileId}
              spec={meta.activity}
              readOnly={true}
            />
          )
        }
        if (meta?.activity?.type === 'custom' && lessonSlug === 'u1-l2') {
            return (
              <U1L2TensionsActivity
                assignmentId={assignmentId}
                lessonId={lessonId}
                profileId={profileId}
                data={meta.activity.data as U1L2ActivityData}
                mode="teacher"
              />
            )
          }
          if (meta?.activity?.type === 'custom' && lessonSlug === 'u1-l3') {
            return (
              <U1L3ThreadsActivity
                assignmentId={assignmentId}
                lessonId={lessonId}
                profileId={profileId}
                data={meta.activity.data as U1L3ActivityData}
                mode="teacher"
              />
            )
          }
          if (meta?.activity?.type === 'custom' && lessonSlug === 'u1-l4') {
            return (
              <U1L4AuditActivity
                assignmentId={assignmentId}
                lessonId={lessonId}
                profileId={profileId}
                data={meta.activity.data as U1L4ActivityData}
                mode="teacher"
              />
            )
          }
          if (meta?.activity?.type === 'custom' && lessonSlug === 'u1-l5') {
            return (
              <U1L5SteelmanActivity
                assignmentId={assignmentId}
                lessonId={lessonId}
                profileId={profileId}
                data={meta.activity.data as U1L5ActivityData}
                mode="teacher"
              />
            )
          }
          if (meta?.activity?.type === 'custom' && lessonSlug === 'u1-l6') {
            return (
              <U1L6DeliberationActivity
                assignmentId={assignmentId}
                lessonId={lessonId}
                profileId={profileId}
                data={meta.activity.data as U1L6ActivityData}
                mode="teacher"
              />
            )
          }
          if (meta?.activity?.type === 'custom' && lessonSlug === 'u1-l7') {
            return (
              <U1L7ReflectionActivity
                data={meta.activity.data as U1L7ActivityData}
                mode="teacher"
              />
            )
          }
        return (
          <div style={placeholderBoxStyle}>
            <strong>Activity</strong> &mdash; no activity defined for this lesson yet.
          </div>
        )
      }
    if (step === 'ledger') {
        if (meta?.ledger) {
          return (
            <LedgerEntryComponent
              assignmentId={assignmentId}
              lessonId={lessonId}
              profileId={profileId}
              spec={meta.ledger}
              readOnly={true}
            />
          )
        }
        return (
          <div style={placeholderBoxStyle}>
            <strong>Ledger</strong> &mdash; no ledger defined for this lesson yet.
          </div>
        )
      }
      return (
        <div style={placeholderBoxStyle}>
          <strong>Unknown step</strong>
        </div>
      )
    }
    function TeacherNotesPanel({
        step,
        teacher,
        onClose,
      }: {
        step: StepKey
        teacher: LessonTeacherNotes | null
        onClose: () => void
      }) {
        if (!teacher) {
          return (
            <Backdrop onClose={onClose}>
              <PanelHeader title="Teaching support" onClose={onClose} />
              <p style={{ color: 'var(--text-faint)', fontSize: '0.95rem' }}>
                No teaching support authored for this lesson yet.
              </p>
            </Backdrop>
          )
        }
      
        const stepLabel = STEP_LABELS[step]
      
        return (
          <Backdrop onClose={onClose}>
            <PanelHeader title={`Teaching support · ${stepLabel}`} onClose={onClose} />
            <p style={supportFramingStyle}>
              Suggestions while running the program.
            </p>
      
            {step === 'briefing' && (
              teacher.briefing?.notes ? (
                <div style={panelBlockStyle}>
                  <div dangerouslySetInnerHTML={{ __html: teacher.briefing.notes }} />
                </div>
              ) : (
                <p style={{ color: 'var(--text-faint)', fontSize: '0.95rem' }}>
                  No briefing-specific notes for this lesson.
                </p>
              )
            )}
      
            {step === 'activity' && teacher.activity && (
              <>
                {teacher.activity.guide && (
                  <div style={panelBlockStyle}>
                    <div style={panelSectionLabelStyle}>About the Activity</div>
                    <div dangerouslySetInnerHTML={{ __html: teacher.activity.guide }} />
                  </div>
                )}
      
                {teacher.activity.callOnScripts && teacher.activity.callOnScripts.length > 0 && (
                  <div style={panelBlockStyle}>
                    <div style={panelSectionLabelStyle}>If you want to call on someone</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                      {teacher.activity.callOnScripts.map((s, i) => (
                        <div key={i} style={panelScriptRowStyle}>
                          <div style={panelScriptTargetStyle}>{s.target}</div>
                          <div style={panelScriptLineStyle}>{s.line}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
      
                {teacher.activity.closingScript && (
                  <div style={panelBlockStyle}>
                    <div style={panelSectionLabelStyle}>{teacher.activity.closingScript.label}</div>
                    {teacher.activity.closingScript.lines.map((line, i) => (
                      <p key={i} style={{ marginBottom: '0.6rem', fontSize: '0.95rem', lineHeight: 1.6 }}>{line}</p>
                    ))}
                  </div>
                )}
      
                {teacher.activity.facilitationNotes && teacher.activity.facilitationNotes.length > 0 && (
                  <div style={panelBlockStyle}>
                    <div style={panelSectionLabelStyle}>Worth a heads-up</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {teacher.activity.facilitationNotes.map((n, i) => (
                        <div key={i} style={panelNoteStyle}>
                          <strong>{n.title}</strong> {n.body}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
      
            {step === 'ledger' && teacher.ledger && (
              teacher.ledger.intro ? (
                <div style={panelBlockStyle}>
                  <div style={panelSectionLabelStyle}>About this entry</div>
                  <div dangerouslySetInnerHTML={{ __html: teacher.ledger.intro }} />
                </div>
              ) : (
                <p style={{ color: 'var(--text-faint)', fontSize: '0.95rem' }}>
                  No ledger-specific notes for this lesson.
                </p>
              )
            )}
          </Backdrop>
        )
      }
      
      function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
        return (
          <>
            {/* Click-outside dismiss */}
            <div
              onClick={onClose}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.18)',
                zIndex: 100,
              }}
            />
            {/* The actual panel */}
            <div style={panelStyle}>
              {children}
            </div>
          </>
        )
      }
      
      function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
        return (
          <div style={panelHeaderStyle}>
            <div style={panelTitleStyle}>{title}</div>
            <button onClick={onClose} style={panelCloseStyle} aria-label="Close panel">
              ✕
            </button>
          </div>
        )
      }
      
      const STEP_LABELS_FOR_PANEL = STEP_LABELS // alias so the function above can use it
const placeholderBoxStyle: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px dashed var(--border)',
  borderRadius: '8px',
  padding: '2rem',
  textAlign: 'center',
  color: 'var(--text-dim)',
  fontSize: '0.92rem',
}

function primaryBtn(loading: string | null) {
  return {
    padding: '0.6rem 1.1rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    color: '#fff',
    background: 'var(--gold)',
    border: 'none',
    borderRadius: '6px',
    cursor: loading ? 'default' : 'pointer',
    opacity: loading ? 0.5 : 1,
  } as const
}

function secondaryBtn(loading: string | null) {
  return {
    padding: '0.6rem 1rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-dim)',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    cursor: loading ? 'default' : 'pointer',
    opacity: loading ? 0.5 : 1,
  } as const
}

function undoBtn(loading: string | null) {
  return {
    padding: '0.6rem 1rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-dim)',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    cursor: loading ? 'default' : 'pointer',
    opacity: loading ? 0.5 : 1,
  } as const
}
const notesBtnStyle: React.CSSProperties = {
    padding: '0.6rem 1rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--teacher)',
    background: 'var(--bg)',
    border: '1px solid var(--teacher-border)',
    borderRadius: '6px',
    cursor: 'pointer',
  }

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '420px',
    maxWidth: '92vw',
    background: 'var(--bg)',
    borderLeft: '1px solid var(--border)',
    boxShadow: '-4px 0 16px rgba(0,0,0,0.08)',
    zIndex: 101,
    overflowY: 'auto',
    padding: '1.5rem 1.5rem 3rem',
  }
  
  const panelHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '1rem',
    marginBottom: '1.25rem',
    borderBottom: '1px solid var(--border)',
  }
  
  const panelTitleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: '1.2rem',
    color: 'var(--text)',
  }
  
  const panelCloseStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    fontSize: '1.2rem',
    color: 'var(--text-faint)',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
  }
  
  const panelBlockStyle: React.CSSProperties = {
    background: 'var(--teacher-bg)',
    border: '1px solid var(--teacher-border)',
    borderLeft: '3px solid var(--teacher)',
    borderRadius: '0 8px 8px 0',
    padding: '1rem 1.15rem',
    marginBottom: '1rem',
    fontSize: '0.93rem',
    lineHeight: 1.6,
    color: 'var(--text)',
  }
  
  const panelSectionLabelStyle: React.CSSProperties = {
    fontSize: '0.66rem',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--teacher)',
    marginBottom: '0.6rem',
  }

  const supportFramingStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    lineHeight: 1.5,
    color: 'var(--text-dim)',
    fontStyle: 'italic',
    background: 'var(--teacher-bg)',
    border: '1px solid var(--teacher-border)',
    borderRadius: '8px',
    padding: '0.75rem 0.95rem',
    marginBottom: '1.25rem',
  }
  
  const panelScriptRowStyle: React.CSSProperties = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '0.75rem 0.95rem',
  }
  
  const panelScriptTargetStyle: React.CSSProperties = {
    fontSize: '0.66rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--teacher)',
    marginBottom: '0.3rem',
  }
  
  const panelScriptLineStyle: React.CSSProperties = {
    fontSize: '0.92rem',
    color: 'var(--text)',
    fontStyle: 'italic',
    lineHeight: 1.55,
  }
  
  const panelNoteStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: 'var(--text)',
    lineHeight: 1.55,
  }
function completeBtn(loading: string | null) {
  return {
    padding: '0.6rem 1rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-dim)',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    cursor: loading ? 'default' : 'pointer',
    opacity: loading ? 0.5 : 1,
  } as const
}