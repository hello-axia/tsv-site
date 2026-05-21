'use client'

import { useEffect, useState } from 'react'
import type { LessonMeta, QuadrantActivity } from '@/lib/lesson-meta-types'

type ActiveSession = {
    currentStep: string | null
    className: string
    classCode: string
    enrollmentCount: number
    lesson: { slug: string; title: string; unit: number; lessonNumber: number; lessonType: string }
    placements: { x: number; y: number }[]
    placementCount: number
    ledgerCount: number
  }
  
  type State =
    | { status: 'no_class' }
    | { status: 'waiting'; className: string; classCode: string }
    | ({ status: 'live' } & ActiveSession)
    | ({ status: 'paused' } & ActiveSession)

type Props = {
  code: string
  initialState: State
  initialMeta: LessonMeta | null
}

export default function BroadcastShell({ code, initialState, initialMeta }: Props) {
  const [state, setState] = useState<State>(initialState)
  const [meta] = useState<LessonMeta | null>(initialMeta)

  useEffect(() => {
    let cancelled = false
    let lastSlug = initialMeta?.slug ?? null

    async function tick() {
      try {
        const res = await fetch(`/api/broadcast/${code}/state`, { cache: 'no-store' })
        if (!res.ok) return
        const next = (await res.json()) as State
        if (cancelled) return
        setState(next)

        if ((next.status === 'live' || next.status === 'paused') && next.lesson.slug !== lastSlug) {
          lastSlug = next.lesson.slug
          window.location.reload()
        }
      } catch {
        // Silent fail — keep last good state on screen.
      }
    }

    const id = setInterval(tick, 3000)
    return () => { cancelled = true; clearInterval(id) }
  }, [code, initialMeta])

  if (state.status === 'no_class') {
    return (
      <CenteredScreen>
        <div style={bigEyebrowStyle}>Broadcast</div>
        <div style={bigTitleStyle}>Class not found</div>
        <div style={bodyStyle}>No class with code <strong>{code}</strong> exists.</div>
      </CenteredScreen>
    )
  }

  if (state.status === 'waiting') {
    return (
      <CenteredScreen>
        <div style={bigEyebrowStyle}>{state.className} · {state.classCode}</div>
        <div style={bigTitleStyle}>Waiting to start</div>
        <div style={bodyStyle}>The teacher will begin the lesson shortly.</div>
      </CenteredScreen>
    )
  }

  if (state.status === 'paused') {
    return (
      <CenteredScreen>
        <div style={bigEyebrowStyle}>{state.className}</div>
        <div style={bigTitleStyle}>⏸ Class is paused</div>
        <div style={bodyStyle}>{state.lesson.title}</div>
      </CenteredScreen>
    )
  }

  // state is narrowed to live here
  const step = (state.currentStep ?? 'briefing') as 'briefing' | 'activity' | 'ledger'

  if (step === 'briefing') return <BriefingScreen state={state} />
  if (step === 'activity') return <ActivityScreen state={state} meta={meta} />
  if (step === 'ledger') return <LedgerScreen state={state} meta={meta} />

  return (
    <CenteredScreen>
      <div style={bigTitleStyle}>{state.lesson.title}</div>
    </CenteredScreen>
  )
}

type LiveState = Extract<State, { status: 'live' }>

function BriefingScreen({ state }: { state: LiveState }) {
  return (
    <CenteredScreen>
      <div style={bigEyebrowStyle}>
        Step 1 — Set the scene · Unit {state.lesson.unit} · Lesson {state.lesson.lessonNumber}
      </div>
      <div style={bigTitleStyle}>{state.lesson.title}</div>
      <div style={bodyStyle}>Reading in progress.</div>
    </CenteredScreen>
  )
}

function ActivityScreen({ state, meta }: { state: LiveState; meta: LessonMeta | null }) {
  const spec = meta?.activity?.type === 'quadrant' ? (meta.activity as QuadrantActivity) : null

  return (
    <div style={fullScreenContainerStyle}>
      <div style={topBarStyle}>
        <div>
          <div style={topEyebrowStyle}>Step 2 — Place yourself · {state.className}</div>
          <div style={topTitleStyle}>{spec ? 'Where do you stand?' : state.lesson.title}</div>
        </div>
        <div style={liveCountStyle}>
          <span style={liveCountNumStyle}>{state.placementCount}</span>
          <span style={liveCountLabelStyle}>of {state.enrollmentCount} placed</span>
        </div>
      </div>

      {spec ? (
        <div style={bigQuadrantWrapperStyle}>
          <div style={bigYAxisStyle}>{spec.yAxis} →</div>
          <div style={bigQuadrantGridStyle}>
            <div style={bigCellStyle}>
              <div style={bigCellNameStyle}>
                {spec.quadrants.find(q => q.key === 'engaged_detached')?.label ?? 'Engaged but Detached'}
              </div>
            </div>
            <div style={bigCellStyle}>
              <div style={bigCellNameStyle}>
                {spec.quadrants.find(q => q.key === 'engaged_affected')?.label ?? 'Engaged & Affected'}
              </div>
            </div>
            <div style={bigCellStyle}>
              <div style={bigCellNameStyle}>
                {spec.quadrants.find(q => q.key === 'disengaged')?.label ?? 'Disengaged & Unbothered'}
              </div>
            </div>
            <div style={bigCellStyle}>
              <div style={bigCellNameStyle}>
                {spec.quadrants.find(q => q.key === 'affected_tuned_out')?.label ?? 'Affected but Tuned Out'}
              </div>
            </div>

            {state.placements.map((p, i) => (
              <span
                key={i}
                style={{
                  ...bigDotStyle,
                  left: `${p.x * 100}%`,
                  bottom: `${p.y * 100}%`,
                }}
              />
            ))}
          </div>
          <div style={bigXAxisStyle}>{spec.xAxis} →</div>
        </div>
      ) : (
        <CenteredScreen>
          <div style={bigTitleStyle}>{state.lesson.title}</div>
          <div style={bodyStyle}>Activity in progress.</div>
        </CenteredScreen>
      )}
    </div>
  )
}

function LedgerScreen({ state, meta }: { state: LiveState; meta: LessonMeta | null }) {
  const ledger = meta?.ledger
  return (
    <div style={fullScreenContainerStyle}>
      <div style={topBarStyle}>
        <div>
          <div style={topEyebrowStyle}>Step 3 — Your civic journal · {state.className}</div>
          <div style={topTitleStyle}>Add to your Ledger.</div>
        </div>
        <div style={liveCountStyle}>
          <span style={liveCountNumStyle}>{state.ledgerCount}</span>
          <span style={liveCountLabelStyle}>of {state.enrollmentCount} submitted</span>
        </div>
      </div>

      <div style={ledgerBodyStyle}>
        {ledger?.mcQuestion && (
          <>
            <div style={ledgerQLabelStyle}>Choose one</div>
            <div style={ledgerQTextStyle}>{ledger.mcQuestion}</div>
            <div style={ledgerOptionsStyle}>
              {(ledger.mcOptions ?? []).map(opt => (
                <div key={opt.key} style={ledgerOptionStyle}>{opt.label}</div>
              ))}
            </div>
          </>
        )}
        {ledger?.writtenPrompt && (
          <>
            <div style={{ ...ledgerQLabelStyle, marginTop: '2rem' }}>Then write</div>
            <div style={ledgerQTextStyle}>{ledger.writtenPrompt}</div>
          </>
        )}
      </div>
    </div>
  )
}

function CenteredScreen({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem',
      textAlign: 'center',
    }}>
      {children}
    </div>
  )
}

const bigEyebrowStyle: React.CSSProperties = {
  fontSize: '1.05rem',
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  marginBottom: '1.5rem',
}

const bigTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(3rem, 8vw, 6rem)',
  lineHeight: 1.1,
  color: 'var(--text)',
  marginBottom: '1.5rem',
  maxWidth: '20ch',
}

const bodyStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  color: 'var(--text-dim)',
  maxWidth: '40rem',
}

const fullScreenContainerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  padding: '2.5rem 3.5rem',
}

const topBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  marginBottom: '1.75rem',
  gap: '2rem',
}

const topEyebrowStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  marginBottom: '0.5rem',
}

const topTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(2rem, 4.5vw, 3.4rem)',
  lineHeight: 1.1,
  color: 'var(--text)',
}

const liveCountStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  textAlign: 'right',
  flexShrink: 0,
}

const liveCountNumStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
  lineHeight: 1,
  color: 'var(--gold)',
}

const liveCountLabelStyle: React.CSSProperties = {
  fontSize: '1rem',
  color: 'var(--text-dim)',
  letterSpacing: '0.04em',
  marginTop: '0.35rem',
}

const bigQuadrantWrapperStyle: React.CSSProperties = {
  flex: 1,
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gridTemplateRows: '1fr auto',
  gap: '1.25rem',
  alignItems: 'stretch',
}

const bigYAxisStyle: React.CSSProperties = {
  writingMode: 'vertical-rl',
  fontSize: '1.05rem',
  fontWeight: 600,
  color: 'var(--text-dim)',
  textAlign: 'center',
  alignSelf: 'center',
  paddingLeft: '0.5rem',
}

const bigXAxisStyle: React.CSSProperties = {
  gridColumn: '2 / 3',
  fontSize: '1.05rem',
  fontWeight: 600,
  color: 'var(--text-dim)',
  textAlign: 'center',
  paddingTop: '0.75rem',
}

const bigQuadrantGridStyle: React.CSSProperties = {
  position: 'relative',
  aspectRatio: '1 / 1',
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gridTemplateRows: '1fr 1fr',
  gap: '3px',
  background: 'var(--border)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  overflow: 'hidden',
  maxHeight: '78vh',
  margin: '0 auto',
  width: '100%',
}

const bigCellStyle: React.CSSProperties = {
  background: 'var(--bg)',
  padding: '1.75rem',
  pointerEvents: 'none',
}

const bigCellNameStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(1.2rem, 1.8vw, 1.7rem)',
  color: 'var(--text)',
  lineHeight: 1.2,
}

const bigDotStyle: React.CSSProperties = {
  position: 'absolute',
  width: '22px',
  height: '22px',
  borderRadius: '50%',
  background: 'rgba(58, 56, 48, 0.6)',
  border: '3px solid #fff',
  transform: 'translate(-50%, 50%)',
  pointerEvents: 'none',
  zIndex: 3,
}

const ledgerBodyStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  maxWidth: '1100px',
  margin: '0 auto',
  width: '100%',
  paddingTop: '1rem',
}

const ledgerQLabelStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  marginBottom: '0.6rem',
}

const ledgerQTextStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(1.5rem, 2.5vw, 2.2rem)',
  lineHeight: 1.25,
  color: 'var(--text)',
  marginBottom: '1.25rem',
  maxWidth: '50ch',
}

const ledgerOptionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
}

const ledgerOptionStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  lineHeight: 1.55,
  color: 'var(--text-dim)',
  padding: '0.9rem 1.2rem',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
}