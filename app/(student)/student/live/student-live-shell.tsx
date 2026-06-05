'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CurrentLiveSession } from '@/lib/live-session'
import type { LessonMeta } from '@/lib/lesson-meta-types'
import QuadrantActivityComponent from './quadrant-activity'
import LedgerEntryComponent from './ledger-entry'
import U1L2TensionsActivity from './u1-l2-tensions-activity'
import U1L3ThreadsActivity from './u1-l3-threads-activity'
import U1L4AuditActivity from './u1-l4-audit-activity'
import U1L5SteelmanActivity from './u1-l5-steelman-activity'
import U1L6DeliberationActivity from './u1-l6-deliberation'
import U1L7ReflectionActivity from './u1-l7-reflection'
import type { U1L2ActivityData } from '@/content/lessons/u1-l2.meta'
import type { U1L3ActivityData } from '@/content/lessons/u1-l3.meta'
import type { U1L4ActivityData } from '@/content/lessons/u1-l4.meta'
import type { U1L5ActivityData } from '@/content/lessons/u1-l5.meta'
import type { U1L6ActivityData } from '@/content/lessons/u1-l6.meta'
import type { U1L7ActivityData } from '@/content/lessons/u1-l7.meta'
type Props = {
    profileId: string
    initialSession: CurrentLiveSession | null
    briefingHtml: string | null
    meta: LessonMeta | null
  }
  
  export default function StudentLiveShell({ profileId, initialSession, briefingHtml, meta }: Props) {

type StepKey = 'briefing' | 'activity' | 'ledger'
const STEP_ORDER: StepKey[] = ['briefing', 'activity', 'ledger']

const LESSON_TYPE_LABELS: Record<string, string> = {
  briefing: 'Briefing',
  artifact_analysis: 'Artifact Analysis',
  deliberation: 'Deliberation',
  civic_action: 'Civic Action',
  reflection: 'Reflection',
  reflection_sharing: 'Reflection Sharing',
}
  const [session, setSession] = useState<CurrentLiveSession | null>(initialSession)

  // Poll every 3s for session state changes.
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function fetchSession() {
      const { data: enrollments } = await supabase
        .from('class_enrollments')
        .select('class_id')
        .eq('student_id', profileId)
      const classIds = (enrollments ?? []).map((e: { class_id: string }) => e.class_id)
      if (classIds.length === 0) {
        if (!cancelled) setSession(null)
        return
      }
      const { data: assignment } = await supabase
        .from('lesson_assignments')
        .select(`
          id, class_id, status, current_step, activity_revealed, started_at,
          lessons(id, slug, title, unit, lesson_number, lesson_type)
        `)
        .in('class_id', classIds)
        .in('status', ['live', 'paused'])
        .maybeSingle()
      if (cancelled) return
      if (!assignment || !assignment.lessons) {
        setSession(null)
        return
      }
      const lesson = assignment.lessons as unknown as CurrentLiveSession['lesson']
      setSession({
        assignment_id: assignment.id,
        class_id: assignment.class_id,
        status: assignment.status as 'live' | 'paused',
        current_step: assignment.current_step,
        activity_revealed: assignment.activity_revealed,
        started_at: assignment.started_at,
        lesson,
      })
    }

    const id = setInterval(fetchSession, 3000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [profileId])

  // --- Empty / paused states ---

  if (!session) {
    return <WaitingCard title="Waiting for your teacher" body="When your teacher starts the lesson, your screen will update automatically." />
  }

  if (session.status === 'paused') {
    return <WaitingCard title="Class is paused" body="Hold tight — your teacher will resume in a moment." />
  }

  // --- Live: cumulative reveal ---

  const currentStep = (session.current_step ?? 'briefing') as StepKey
  const currentIdx = STEP_ORDER.indexOf(currentStep)
  const unlockedSteps = STEP_ORDER.slice(0, currentIdx + 1)
  const lessonTypeLabel = LESSON_TYPE_LABELS[session.lesson.lesson_type] ?? session.lesson.lesson_type

  return (
    <div>
      {/* Progress bar */}
      <div style={progressBarStyle}>
        <div style={progressLessonStyle}>
          <span style={lessonTypeBadgeStyle}>{lessonTypeLabel}</span>
          <span style={{ fontWeight: 600 }}>{session.lesson.title}</span>
        </div>
        <ProgressSteps currentIdx={currentIdx} />
      </div>

      {/* Briefing stage */}
      {unlockedSteps.includes('briefing') && (
        <Stage
          number={1}
          flag={meta?.framing?.briefing?.flag ?? 'Set the scene'}
          title={meta?.framing?.briefing?.title ?? session.lesson.title}
          isCurrent={currentStep === 'briefing'}
        >
          {briefingHtml ? (
            <div className="lesson-reading" dangerouslySetInnerHTML={{ __html: briefingHtml }} />
          ) : (
            <div className="lesson-reading">
              <p style={{ color: 'var(--text-faint)' }}>(No briefing content for this lesson yet.)</p>
            </div>
          )}
        </Stage>
      )}

      {/* Activity stage */}
      {unlockedSteps.includes('activity') && (
        <Stage
          number={2}
          flag={meta?.framing?.activity?.flag ?? 'Place yourself'}
          title={meta?.framing?.activity?.title ?? 'Where do you stand?'}
          isCurrent={currentStep === 'activity'}
        >
          {meta?.activity?.type === 'quadrant' && session ? (
            <QuadrantActivityComponent
              assignmentId={session.assignment_id}
              lessonId={session.lesson.id}
              profileId={profileId}
              spec={meta.activity}
            />
        ) : meta?.activity?.type === 'custom' && session?.lesson.slug === 'u1-l2' ? (
            <U1L2TensionsActivity
              assignmentId={session.assignment_id}
              lessonId={session.lesson.id}
              profileId={profileId}
              data={meta.activity.data as U1L2ActivityData}
              mode="student"
            />
          ) : meta?.activity?.type === 'custom' && session?.lesson.slug === 'u1-l3' ? (
            <U1L3ThreadsActivity
              assignmentId={session.assignment_id}
              lessonId={session.lesson.id}
              profileId={profileId}
              data={meta.activity.data as U1L3ActivityData}
              mode="student"
            />
          ) : meta?.activity?.type === 'custom' && session?.lesson.slug === 'u1-l4' ? (
            <U1L4AuditActivity
              assignmentId={session.assignment_id}
              lessonId={session.lesson.id}
              profileId={profileId}
              data={meta.activity.data as U1L4ActivityData}
              mode="student"
            />
          ) : meta?.activity?.type === 'custom' && session?.lesson.slug === 'u1-l5' ? (
            <U1L5SteelmanActivity
              assignmentId={session.assignment_id}
              lessonId={session.lesson.id}
              profileId={profileId}
              data={meta.activity.data as U1L5ActivityData}
              mode="student"
            />
          ) : meta?.activity?.type === 'custom' && session?.lesson.slug === 'u1-l6' ? (
            <U1L6DeliberationActivity
              assignmentId={session.assignment_id}
              lessonId={session.lesson.id}
              profileId={profileId}
              data={meta.activity.data as U1L6ActivityData}
              mode="student"
            />
          ) : meta?.activity?.type === 'custom' && session?.lesson.slug === 'u1-l7' ? (
            <U1L7ReflectionActivity
              data={meta.activity.data as U1L7ActivityData}
              mode="student"
            />
          ) : (
            <div style={placeholderBoxStyle}>
              <strong>Activity</strong> &mdash; no activity defined for this lesson yet.
            </div>
          )}
        </Stage>
      )}

      {/* Ledger stage */}
      {unlockedSteps.includes('ledger') && (
        <Stage
          number={3}
          flag={meta?.framing?.ledger?.flag ?? 'Your civic journal'}
          title={meta?.framing?.ledger?.title ?? 'Add to your Ledger.'}
          isCurrent={currentStep === 'ledger'}
        >
          {meta?.ledger && session ? (
            <LedgerEntryComponent
              assignmentId={session.assignment_id}
              lessonId={session.lesson.id}
              profileId={profileId}
              spec={meta.ledger}
            />
          ) : (
            <div style={placeholderBoxStyle}>
              <strong>Ledger</strong> &mdash; no ledger defined for this lesson yet.
            </div>
          )}
        </Stage>
      )}
    </div>
  )
}

// --- Subcomponents ---

function ProgressSteps({ currentIdx }: { currentIdx: number }) {
  const labels = ['Briefing', 'Activity', 'Ledger']
  return (
    <div style={progressStepsStyle}>
      {labels.map((label, i) => {
        const done = i < currentIdx
        const current = i === currentIdx
        const dotStyle = done
          ? { ...pNumStyle, background: '#2f5d62', borderColor: '#2f5d62', color: '#fff' }
          : current
            ? { ...pNumStyle, background: 'var(--gold)', borderColor: 'var(--gold)', color: '#fff' }
            : pNumStyle
        const labelColor = done ? 'var(--text-dim)' : current ? 'var(--text)' : 'var(--text-faint)'
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 600, color: labelColor }}>
              <span style={dotStyle}>{done ? '✓' : i + 1}</span>
              {label}
            </div>
            {i < labels.length - 1 && <span style={pConnStyle} />}
          </div>
        )
      })}
    </div>
  )
}

function Stage({ number, flag, title, isCurrent, children }: {
  number: number
  flag: string
  title: string
  isCurrent: boolean
  children: React.ReactNode
}) {
  return (
    <section style={{ marginTop: number === 1 ? '0' : '3rem', opacity: isCurrent ? 1 : 0.94 }}>
      <div style={stageFlagStyle}>
        <span style={stageFlagLineStyle} />
        Step {number} &mdash; {flag}
      </div>
      <h1 style={stageTitleStyle}>{title}</h1>
      {children}
    </section>
  )
}

function WaitingCard({ title, body }: { title: string; body: string }) {
  return (
    <div style={waitingBoxStyle}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text)', marginBottom: '0.75rem' }}>
        {title}
      </div>
      <p style={{ fontSize: '0.95rem', color: 'var(--text-faint)', maxWidth: '420px', margin: '0 auto' }}>
        {body}
      </p>
    </div>
  )
}

// --- Styles ---

const progressBarStyle: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '0.9rem 1.25rem',
  marginBottom: '2.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '2rem',
  flexWrap: 'wrap',
}

const progressLessonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.65rem',
  fontSize: '0.92rem',
  color: 'var(--text)',
}

const lessonTypeBadgeStyle: React.CSSProperties = {
  fontSize: '0.62rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  background: 'var(--text)',
  color: 'var(--gold)',
  padding: '0.25rem 0.55rem',
  borderRadius: '4px',
}

const progressStepsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}

const pNumStyle: React.CSSProperties = {
  width: '1.7rem',
  height: '1.7rem',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-display)',
  fontSize: '0.82rem',
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  color: 'var(--text-faint)',
}

const pConnStyle: React.CSSProperties = {
  width: '1.4rem',
  height: '2px',
  background: 'var(--border)',
}

const stageFlagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.6rem',
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  marginBottom: '0.7rem',
}

const stageFlagLineStyle: React.CSSProperties = {
  width: '1.7rem',
  height: '1px',
  background: 'var(--gold)',
}

const stageTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '2.3rem',
  lineHeight: 1.15,
  letterSpacing: '-0.015em',
  color: 'var(--text)',
  margin: '0 0 1.75rem',
}

const waitingBoxStyle: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '3rem 2rem',
  textAlign: 'center',
  marginTop: '2rem',
}

const placeholderBoxStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px dashed var(--border)',
  borderRadius: '8px',
  padding: '2rem',
  textAlign: 'center',
  color: 'var(--text-dim)',
  fontSize: '0.92rem',
}