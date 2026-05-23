'use client'

import { useEffect, useState } from 'react'
import type { LessonMeta, QuadrantActivity } from '@/lib/lesson-meta-types'
import type { U1L2ActivityData, U1L2Scenario } from '@/content/lessons/u1-l2.meta'
import type { U1L3ActivityData, U1L3Claim } from '@/content/lessons/u1-l3.meta'

export type RawSubmission = {
    student_id: string
    data: unknown
  }
  
  export type ActiveSession = {
      currentStep: string | null
      activityState: Record<string, unknown>
      className: string
      classCode: string
      enrollmentCount: number
      lesson: { slug: string; title: string; unit: number; lessonNumber: number; lessonType: string }
      placements: { x: number; y: number }[]
      placementCount: number
      submissions: RawSubmission[]
      ledgerCount: number
    }
    
    export type State =
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
    // u1-l2 takes its own broadcast renderer.
    if (state.lesson.slug === 'u1-l2' && meta?.activity?.type === 'custom') {
      return <U1L2BroadcastScreen state={state} data={meta.activity.data as U1L2ActivityData} />
    }
    if (state.lesson.slug === 'u1-l3' && meta?.activity?.type === 'custom') {
      return <U1L3BroadcastScreen state={state} data={meta.activity.data as U1L3ActivityData} />
    }
  
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

  function U1L2BroadcastScreen({ state, data }: { state: LiveState; data: U1L2ActivityData }) {
    const currentScenarioRaw = state.activityState?.currentScenario
    const currentScenarioNum = typeof currentScenarioRaw === 'number' ? currentScenarioRaw : 1
    const scenario: U1L2Scenario | undefined = data.scenarios.find(s => s.index === currentScenarioNum)
  
    // Extract positions for the current scenario from raw submissions.
    const scenarioKey = `scenario${currentScenarioNum}` as 'scenario1' | 'scenario2' | 'scenario3'
    const positions: number[] = []
    for (const sub of state.submissions) {
      const d = sub.data as Partial<Record<typeof scenarioKey, { position?: number; locked?: boolean } | null>>
      const placement = d[scenarioKey]
      if (placement && placement.locked && typeof placement.position === 'number') {
        positions.push(placement.position)
      }
    }
  
    if (!scenario) {
      return (
        <CenteredScreen>
          <div style={bigTitleStyle}>{state.lesson.title}</div>
        </CenteredScreen>
      )
    }
  
    return (
      <div style={fullScreenContainerStyle}>
        <div style={topBarStyle}>
          <div>
            <div style={topEyebrowStyle}>
              Step 2 — Where do you stand? · Liberty vs. Equality · {state.className}
            </div>
            <div style={topTitleStyle}>{scenario.title}</div>
          </div>
          <div style={liveCountStyle}>
            <span style={liveCountNumStyle}>{positions.length}</span>
            <span style={liveCountLabelStyle}>of {state.enrollmentCount} placed</span>
          </div>
        </div>
  
        {/* Scenario progress */}
        <div style={broadcastPillsStyle}>
          {data.scenarios.map(s => {
            const isCurrent = s.index === currentScenarioNum
            return (
              <div
                key={s.key}
                style={{
                  ...broadcastPillStyle,
                  background: isCurrent ? '#2980b9' : 'var(--bg2)',
                  color: isCurrent ? '#fff' : 'var(--text-dim)',
                  border: `2px solid ${isCurrent ? '#2980b9' : 'var(--border)'}`,
                }}
              >
                Scenario {s.index}
              </div>
            )
          })}
        </div>
  
        {scenario.prompt && (
          <div style={broadcastPromptStyle}>{scenario.prompt}</div>
        )}
  
        {/* Argument boxes */}
        <div style={broadcastArgsStyle}>
          <div style={broadcastArgBoxStyle}>
            <div style={{ ...broadcastArgSideStyle, color: 'var(--gold)' }}>Liberty end</div>
            <div style={broadcastArgLabelStyle}>{scenario.libertyEnd.label}</div>
            <div style={broadcastArgTextStyle}>{scenario.libertyEnd.valueArgument}</div>
          </div>
          <div style={broadcastArgBoxStyle}>
            <div style={{ ...broadcastArgSideStyle, color: '#2980b9' }}>Equality end</div>
            <div style={broadcastArgLabelStyle}>{scenario.equalityEnd.label}</div>
            <div style={broadcastArgTextStyle}>{scenario.equalityEnd.valueArgument}</div>
          </div>
        </div>
  
        {/* The big slider, broadcast-style */}
        <div style={broadcastSliderWrapStyle}>
          <div style={broadcastTrackStyle}>
            <div style={broadcastCenterMarkStyle} />
            {positions.map((p, i) => (
              <span
                key={i}
                style={{
                  ...broadcastBigDotStyle,
                  left: `${p * 100}%`,
                }}
              />
            ))}
          </div>
          <div style={broadcastScaleStyle}>
            <span style={{ color: 'var(--gold)' }}>← Liberty</span>
            <span style={{ color: 'var(--text-faint)' }}>Center</span>
            <span style={{ color: '#2980b9' }}>Equality →</span>
          </div>
        </div>
      </div>
    )
  }

  function U1L3BroadcastScreen({ state, data }: { state: LiveState; data: U1L3ActivityData }) {
    const shownClaimsRaw = state.activityState?.shownClaims
    const revealedClaimsRaw = state.activityState?.revealedClaims
    const shownClaims: number[] = Array.isArray(shownClaimsRaw)
      ? (shownClaimsRaw.filter(n => typeof n === 'number') as number[])
      : []
    const revealedClaims: number[] = Array.isArray(revealedClaimsRaw)
      ? (revealedClaimsRaw.filter(n => typeof n === 'number') as number[])
      : []
  
    // Count students who have marked their submission as `submitted: true`
    let submittedCount = 0
    for (const sub of state.submissions) {
      const d = sub.data as { submitted?: boolean } | null
      if (d?.submitted) submittedCount++
    }
  
    const anyShown = shownClaims.length > 0
  
    return (
      <div style={fullScreenContainerStyle}>
        <div style={topBarStyle}>
          <div>
            <div style={topEyebrowStyle}>
              Step 2 — Spot the threads · {state.className}
            </div>
            <div style={topTitleStyle}>
              {anyShown
                ? `${shownClaims.length} of ${data.claims.length} claims shown`
                : 'Empirical vs. Normative'}
            </div>
          </div>
          <div style={liveCountStyle}>
            <span style={liveCountNumStyle}>{submittedCount}</span>
            <span style={liveCountLabelStyle}>of {state.enrollmentCount} submitted</span>
          </div>
        </div>
  
        <div style={u1l3BroadcastClaimsListStyle}>
          {data.claims.map(claim => (
            <U1L3BroadcastClaim
              key={claim.key}
              claim={claim}
              shown={shownClaims.includes(claim.index)}
              revealed={revealedClaims.includes(claim.index)}
            />
          ))}
        </div>
      </div>
    )
  }
  
  function U1L3BroadcastClaim({ claim, shown, revealed }: { claim: U1L3Claim; shown: boolean; revealed: boolean }) {
    return (
      <div style={{ ...u1l3BroadcastClaimCardStyle, opacity: shown ? 1 : 0.4 }}>
        <div style={u1l3BroadcastClaimHeadStyle}>
          <span style={u1l3BroadcastClaimNumStyle}>{claim.index}</span>
          <div style={u1l3BroadcastClaimTextStyle}>
            {shown ? claim.claim : <em style={{ color: 'var(--text-faint)' }}>Hidden</em>}
          </div>
        </div>
  
        {revealed && (
          <div style={u1l3BroadcastAnswersGridStyle}>
            <div style={u1l3BroadcastAnswerBoxStyle}>
              <div style={{ ...u1l3BroadcastAnswerLabelStyle, color: 'var(--gold)' }}>
                Empirical thread
              </div>
              <div style={u1l3BroadcastAnswerTextStyle}>{claim.answerKey.empirical}</div>
            </div>
            <div style={u1l3BroadcastAnswerBoxStyle}>
              <div style={{ ...u1l3BroadcastAnswerLabelStyle, color: '#2980b9' }}>
                Normative thread
              </div>
              <div style={u1l3BroadcastAnswerTextStyle}>{claim.answerKey.normative}</div>
            </div>
          </div>
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

const broadcastPillsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1.75rem',
  }
  
  const broadcastPillStyle: React.CSSProperties = {
    padding: '0.55rem 1.2rem',
    fontSize: '1rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    borderRadius: '999px',
  }
  
  const broadcastPromptStyle: React.CSSProperties = {
    background: 'var(--bg2)',
    borderLeft: '4px solid var(--text-faint)',
    borderRadius: '0 8px 8px 0',
    padding: '1.1rem 1.4rem',
    fontSize: '1.2rem',
    lineHeight: 1.5,
    color: 'var(--text)',
    marginBottom: '1.5rem',
    maxWidth: '64rem',
  }
  
  const broadcastArgsStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    marginBottom: '2.5rem',
  }
  
  const broadcastArgBoxStyle: React.CSSProperties = {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '1.4rem 1.7rem',
  }
  
  const broadcastArgSideStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: '0.65rem',
  }
  
  const broadcastArgLabelStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: '1.2rem',
    color: 'var(--text)',
    lineHeight: 1.35,
    marginBottom: '0.7rem',
  }
  
  const broadcastArgTextStyle: React.CSSProperties = {
    fontSize: '1rem',
    color: 'var(--text-dim)',
    lineHeight: 1.6,
  }
  
  const broadcastSliderWrapStyle: React.CSSProperties = {
    marginTop: 'auto',
    marginBottom: '1rem',
  }
  
  const broadcastTrackStyle: React.CSSProperties = {
    position: 'relative',
    height: '110px',
    background: 'linear-gradient(to right, rgba(200, 169, 110, 0.16), rgba(255,255,255,0) 50%, rgba(41, 128, 185, 0.16))',
    border: '2px solid var(--border)',
    borderRadius: '999px',
    marginBottom: '1rem',
  }
  
  const broadcastCenterMarkStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '15%',
    bottom: '15%',
    width: '2px',
    background: 'var(--border)',
    transform: 'translateX(-50%)',
  }
  
  const broadcastBigDotStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    background: 'rgba(58, 56, 48, 0.6)',
    border: '3px solid #fff',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  }
  
  const broadcastScaleStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '1.05rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '0 0.5rem',
  }

  const u1l3BroadcastClaimsListStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    overflowY: 'auto',
    paddingBottom: '1rem',
  }
  
  const u1l3BroadcastClaimCardStyle: React.CSSProperties = {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '1.25rem 1.5rem',
  }
  
  const u1l3BroadcastClaimHeadStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: '1rem',
    marginBottom: '0.5rem',
  }
  
  const u1l3BroadcastClaimNumStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    color: 'var(--gold)',
    lineHeight: 1,
    flexShrink: 0,
    minWidth: '2.5rem',
  }
  
  const u1l3BroadcastClaimTextStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.4rem, 2vw, 1.8rem)',
    color: 'var(--text)',
    lineHeight: 1.3,
  }
  
  const u1l3BroadcastAnswersGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginTop: '0.75rem',
  }
  
  const u1l3BroadcastAnswerBoxStyle: React.CSSProperties = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '0.85rem 1rem',
  }
  
  const u1l3BroadcastAnswerLabelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: '0.4rem',
  }
  
  const u1l3BroadcastAnswerTextStyle: React.CSSProperties = {
    fontSize: '0.92rem',
    color: 'var(--text-dim)',
    lineHeight: 1.5,
  }