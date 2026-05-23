'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { U1L2ActivityData, U1L2Scenario } from '@/content/lessons/u1-l2.meta'

// One student's per-scenario placement. Position is 0..1, Liberty=0, Equality=1.
type ScenarioPlacement = { position: number; locked: boolean } | null

// The full data shape stored on each student's activity_submissions row.
type U1L2Submission = {
  scenario1: ScenarioPlacement
  scenario2: ScenarioPlacement
  scenario3: ScenarioPlacement
}

// For teacher/broadcast: the full set of submissions for the class.
type PeerPlacement = {
  student_id: string
  display_name?: string | null
  scenario1: ScenarioPlacement
  scenario2: ScenarioPlacement
  scenario3: ScenarioPlacement
}

type Mode = 'student' | 'teacher' | 'broadcast'

type Props = {
  assignmentId: string
  lessonId: string
  profileId: string
  data: U1L2ActivityData
  mode?: Mode

  // For broadcast mode only: pre-fetched data, since broadcast routes through
  // the admin-key API endpoint and doesn't talk to Supabase directly.
  broadcastCurrentScenario?: number
  broadcastPeers?: PeerPlacement[]
}

const SCENARIO_KEYS = ['scenario1', 'scenario2', 'scenario3'] as const
type ScenarioKey = typeof SCENARIO_KEYS[number]

export default function U1L2TensionsActivity({
  assignmentId,
  lessonId,
  profileId,
  data,
  mode = 'student',
  broadcastCurrentScenario,
  broadcastPeers,
}: Props) {
  // Which scenario the teacher has the class on. Source of truth is the
  // lesson_assignments.activity_state JSONB. Default to 1.
  const [currentScenario, setCurrentScenario] = useState<number>(
    broadcastCurrentScenario ?? 1
  )

  // Student's own submission row.
  const [mySubmission, setMySubmission] = useState<U1L2Submission>({
    scenario1: null,
    scenario2: null,
    scenario3: null,
  })

  // Class submissions, for distribution display.
  const [peers, setPeers] = useState<PeerPlacement[]>(broadcastPeers ?? [])
  const [classSize, setClassSize] = useState<number>(0)

  // Local slider position (uncommitted) for the current scenario.
  const [draftPos, setDraftPos] = useState<number>(0.5)
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // --- Poll the assignment's activity_state to follow teacher's scenario nav.
  // Student + teacher modes poll. Broadcast mode gets currentScenario from prop.
  useEffect(() => {
    if (mode === 'broadcast') return
    const supabase = createClient()
    let cancelled = false

    async function fetchActivityState() {
      const { data: row } = await supabase
        .from('lesson_assignments')
        .select('activity_state')
        .eq('id', assignmentId)
        .maybeSingle()
      if (cancelled || !row) return
      const stateObj = (row.activity_state ?? {}) as { currentScenario?: number }
      if (typeof stateObj.currentScenario === 'number') {
        setCurrentScenario(stateObj.currentScenario)
      }
    }

    fetchActivityState()
    const id = setInterval(fetchActivityState, 3000)
    return () => { cancelled = true; clearInterval(id) }
  }, [assignmentId, mode])

  // --- Load student's own submission on mount (student mode only).
  useEffect(() => {
    if (mode !== 'student') return
    const supabase = createClient()
    let cancelled = false
    ;(async () => {
      const { data: row } = await supabase
        .from('activity_submissions')
        .select('data')
        .eq('assignment_id', assignmentId)
        .eq('student_id', profileId)
        .maybeSingle()
      if (cancelled || !row) return
      const d = row.data as Partial<U1L2Submission>
      setMySubmission({
        scenario1: d.scenario1 ?? null,
        scenario2: d.scenario2 ?? null,
        scenario3: d.scenario3 ?? null,
      })
    })()
    return () => { cancelled = true }
  }, [assignmentId, profileId, mode])

  // --- Poll class submissions (student + teacher modes).
  useEffect(() => {
    if (mode === 'broadcast') return
    const supabase = createClient()
    let cancelled = false

    async function fetchPeers() {
      const { data: subs } = await supabase
        .from('activity_submissions')
        .select('data, student_id')
        .eq('assignment_id', assignmentId)
      if (cancelled) return

      const parsed: PeerPlacement[] = []
      for (const row of subs ?? []) {
        const d = row.data as Partial<U1L2Submission>
        parsed.push({
          student_id: row.student_id,
          scenario1: d.scenario1 ?? null,
          scenario2: d.scenario2 ?? null,
          scenario3: d.scenario3 ?? null,
        })
      }
      setPeers(parsed)
    }

    async function fetchClassSize() {
      const { data: assignment } = await supabase
        .from('lesson_assignments')
        .select('class_id')
        .eq('id', assignmentId)
        .maybeSingle()
      if (cancelled || !assignment) return
      const { count } = await supabase
        .from('class_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', assignment.class_id)
      if (cancelled) return
      setClassSize(count ?? 0)
    }

    fetchPeers()
    fetchClassSize()
    const id = setInterval(fetchPeers, 3000)
    return () => { cancelled = true; clearInterval(id) }
  }, [assignmentId, mode])

  // --- Sync draft position when scenario changes (student mode).
  useEffect(() => {
    if (mode !== 'student') return
    const key = `scenario${currentScenario}` as ScenarioKey
    const existing = mySubmission[key]
    if (existing && typeof existing.position === 'number') {
      setDraftPos(existing.position)
      setTouched(true)
    } else {
      setDraftPos(0.5)
      setTouched(false)
    }
  }, [currentScenario, mySubmission, mode])

  // --- Student-mode helpers
  const scenarioKey = `scenario${currentScenario}` as ScenarioKey
  const myCurrent = mySubmission[scenarioKey]
  const isLocked = mode === 'student' && !!myCurrent?.locked

  const scenario: U1L2Scenario | undefined = data.scenarios.find(s => s.index === currentScenario)

  async function advanceScenario(target: number) {
    // Teacher-only action — writes activity_state to lesson_assignments.
    if (mode !== 'teacher') return
    if (target < 1 || target > 3) return
    const supabase = createClient()
    const { error } = await supabase
      .from('lesson_assignments')
      .update({ activity_state: { currentScenario: target } })
      .eq('id', assignmentId)
    if (error) {
      alert(`Could not advance scenario. ${error.message}`)
      return
    }
    setCurrentScenario(target)
  }

  async function lockIn() {
    if (mode !== 'student' || submitting || isLocked) return
    setSubmitting(true)
    const supabase = createClient()
    const nextSub: U1L2Submission = {
      ...mySubmission,
      [scenarioKey]: { position: draftPos, locked: true },
    }
    const { error } = await supabase
      .from('activity_submissions')
      .upsert({
        student_id: profileId,
        assignment_id: assignmentId,
        lesson_id: lessonId,
        activity_type: 'u1_l2_tensions',
        data: nextSub,
        submitted_at: new Date().toISOString(),
      }, { onConflict: 'student_id,assignment_id' })
    if (error) {
      alert(`Could not submit. ${error.message}`)
      setSubmitting(false)
      return
    }
    setMySubmission(nextSub)
    // Stamp lesson_progress as having submitted activity (after at least one).
    await supabase
      .from('lesson_progress')
      .upsert({
        student_id: profileId,
        assignment_id: assignmentId,
        lesson_id: lessonId,
        current_step: 'activity',
        activity_submitted_at: new Date().toISOString(),
      }, { onConflict: 'student_id,assignment_id' })
    setSubmitting(false)
  }

  // --- Compute peer positions for the current scenario.
  const peerPositions: { position: number; isSelf: boolean; student_id: string }[] = []
  for (const p of peers) {
    const placement = p[scenarioKey]
    if (placement && typeof placement.position === 'number' && placement.locked) {
      peerPositions.push({
        position: placement.position,
        isSelf: p.student_id === profileId,
        student_id: p.student_id,
      })
    }
  }
  const placedCount = peerPositions.length

  if (!scenario) {
    return <div style={containerStyle}>No scenario data.</div>
  }

  return (
    <div style={containerStyle}>
      {/* Header: tension + scenario nav */}
      <div style={headerRowStyle}>
        <div>
          <div style={tensionLabelStyle}>Tension · {data.tension}</div>
          <div style={scenarioTitleStyle}>{scenario.title}</div>
        </div>
        {mode === 'teacher' && (
          <TeacherScenarioControls
            current={currentScenario}
            total={data.scenarios.length}
            onJump={advanceScenario}
          />
        )}
      </div>

      {/* Scenario pills (visible in all modes) */}
      <ScenarioPills
        scenarios={data.scenarios}
        current={currentScenario}
        clickable={mode === 'teacher'}
        onClick={mode === 'teacher' ? advanceScenario : undefined}
      />

      {/* Optional prompt */}
      {scenario.prompt && (
        <div style={promptBoxStyle}>{scenario.prompt}</div>
      )}

      {/* Two arguments, both visible from the start (per decision 5). */}
      <div style={argsGridStyle}>
        <div style={argBoxStyle}>
          <div style={{ ...argSideStyle, color: 'var(--gold)' }}>Liberty end</div>
          <div style={argLabelStyle}>{scenario.libertyEnd.label}</div>
          <div style={argTextStyle}>{scenario.libertyEnd.valueArgument}</div>
        </div>
        <div style={argBoxStyle}>
          <div style={{ ...argSideStyle, color: '#2980b9' }}>Equality end</div>
          <div style={argLabelStyle}>{scenario.equalityEnd.label}</div>
          <div style={argTextStyle}>{scenario.equalityEnd.valueArgument}</div>
        </div>
      </div>

      {/* The slider */}
      <ScenarioSlider
        scenario={scenario}
        mode={mode}
        draftPos={draftPos}
        setDraftPos={setDraftPos}
        touched={touched}
        setTouched={setTouched}
        isLocked={isLocked}
        peerPositions={peerPositions}
        myProfileId={profileId}
      />

      {/* Footer: student lock-in or teacher/broadcast count */}
      {mode === 'student' && !isLocked && (
        <div style={footerStyle}>
          <button
            onClick={lockIn}
            disabled={!touched || submitting}
            style={{
              ...lockBtnStyle,
              opacity: !touched || submitting ? 0.5 : 1,
              cursor: !touched || submitting ? 'default' : 'pointer',
            }}
          >
            {submitting ? 'Locking in…' : 'Lock in my placement'}
          </button>
          <p style={hintStyle}>
            Drag the handle anywhere between Liberty and Equality. Once you lock in, you can&rsquo;t
            change this scenario. Be honest, not impressive.
          </p>
        </div>
      )}

      {mode === 'student' && isLocked && (
        <div style={lockedFooterStyle}>
          <div style={lockedHeaderStyle}>
            <span style={liveDotInline} />
            {placedCount} of {classSize || '?'} placed on this scenario · updating live
          </div>
          <p style={anonNoteStyle}>
            🔒 Your placement is <strong>anonymous</strong>. The class sees the overall pattern,
            never who placed where.
          </p>
        </div>
      )}

      {mode === 'teacher' && (
        <div style={teacherFooterStyle}>
          <span style={teacherStatStyle}>
            <span style={liveDotInline} />
            {placedCount} of {classSize || '?'} students placed on Scenario {currentScenario}
          </span>
        </div>
      )}

      {mode === 'broadcast' && (
        <div style={teacherFooterStyle}>
          <span style={teacherStatStyle}>
            <span style={liveDotInline} />
            {placedCount} placed
          </span>
        </div>
      )}
    </div>
  )
}

// ---------- Sub-components ----------

function TeacherScenarioControls({
  current, total, onJump,
}: { current: number; total: number; onJump: (target: number) => void }) {
  return (
    <div style={teacherControlsStyle}>
      <button
        onClick={() => onJump(current - 1)}
        disabled={current <= 1}
        style={{ ...navBtnStyle, opacity: current <= 1 ? 0.4 : 1 }}
      >
        ← Prev
      </button>
      <span style={teacherCounterStyle}>Scenario {current} / {total}</span>
      <button
        onClick={() => onJump(current + 1)}
        disabled={current >= total}
        style={{ ...navBtnStyle, opacity: current >= total ? 0.4 : 1 }}
      >
        Next →
      </button>
    </div>
  )
}

function ScenarioPills({
  scenarios, current, clickable, onClick,
}: {
  scenarios: U1L2Scenario[]
  current: number
  clickable: boolean
  onClick?: (target: number) => void
}) {
  return (
    <div style={pillsRowStyle}>
      {scenarios.map(s => {
        const isCurrent = s.index === current
        return (
          <button
            key={s.key}
            onClick={clickable && onClick ? () => onClick(s.index) : undefined}
            disabled={!clickable}
            style={{
              ...pillStyle,
              cursor: clickable ? 'pointer' : 'default',
              background: isCurrent ? '#2980b9' : 'var(--bg2)',
              color: isCurrent ? '#fff' : 'var(--text-dim)',
              border: `1px solid ${isCurrent ? '#2980b9' : 'var(--border)'}`,
            }}
          >
            Scenario {s.index}
          </button>
        )
      })}
    </div>
  )
}

function ScenarioSlider({
  scenario, mode, draftPos, setDraftPos, touched, setTouched,
  isLocked, peerPositions, myProfileId,
}: {
  scenario: U1L2Scenario
  mode: Mode
  draftPos: number
  setDraftPos: (n: number) => void
  touched: boolean
  setTouched: (b: boolean) => void
  isLocked: boolean
  peerPositions: { position: number; isSelf: boolean; student_id: string }[]
  myProfileId: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)

  function placeFromEvent(clientX: number) {
    if (mode !== 'student' || isLocked) return
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    setDraftPos(x)
    setTouched(true)
  }

  function onPointerDown(e: React.PointerEvent) {
    if (mode !== 'student' || isLocked) return
    placeFromEvent(e.clientX)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (mode !== 'student' || isLocked) return
    if (e.buttons === 0) return
    placeFromEvent(e.clientX)
  }
  function onKeyDown(e: React.KeyboardEvent) {
    if (mode !== 'student' || isLocked) return
    const step = e.shiftKey ? 0.1 : 0.04
    let x = draftPos
    let handled = true
    if (e.key === 'ArrowLeft') x = Math.max(0, x - step)
    else if (e.key === 'ArrowRight') x = Math.min(1, x + step)
    else handled = false
    if (handled) {
      e.preventDefault()
      setDraftPos(x)
      setTouched(true)
    }
  }

  // Where to render student's own handle in non-student modes.
  const myPeerPos = peerPositions.find(p => p.isSelf)?.position
  const handlePos = mode === 'student' ? draftPos : (myPeerPos ?? null)

  return (
    <div style={sliderWrapStyle}>
      {/* Liberty / Equality endpoint labels */}
      <div style={sliderEndsRowStyle}>
        <div style={sliderEndLeftStyle}>
          <div style={sliderEndArrowLibertyStyle}>←</div>
          <div style={sliderEndLabelStyle}>{scenario.libertyEnd.label}</div>
        </div>
        <div style={sliderEndRightStyle}>
          <div style={sliderEndLabelStyle}>{scenario.equalityEnd.label}</div>
          <div style={sliderEndArrowEqualityStyle}>→</div>
        </div>
      </div>

      {/* The track */}
      <div
        ref={trackRef}
        role={mode === 'student' && !isLocked ? 'slider' : undefined}
        aria-label="Place yourself between Liberty and Equality"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={draftPos}
        tabIndex={mode === 'student' && !isLocked ? 0 : -1}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
        style={{
          ...trackStyle,
          cursor: mode === 'student' && !isLocked ? 'pointer' : 'default',
        }}
      >
        {/* Center mark */}
        <div style={centerMarkStyle} />

        {/* Peer dots */}
        {peerPositions.map((p, i) => (
          <span
            key={i}
            title={mode === 'teacher' ? p.student_id : undefined}
            style={{
              ...peerDotStyle,
              left: `${p.position * 100}%`,
              background: p.isSelf && mode === 'student'
                ? 'var(--gold)'
                : 'rgba(58, 56, 48, 0.55)',
              zIndex: p.isSelf && mode === 'student' ? 4 : 2,
            }}
            aria-hidden="true"
          />
        ))}

        {/* Student's draft handle (only if not yet locked, student mode) */}
        {mode === 'student' && !isLocked && handlePos !== null && (
          <span
            style={{
              ...myHandleStyle,
              left: `${handlePos * 100}%`,
              opacity: touched ? 1 : 0.5,
            }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Below-track scale */}
      <div style={scaleRowStyle}>
        <span style={scaleLibertyStyle}>Liberty</span>
        <span style={scaleMiddleStyle}>Center</span>
        <span style={scaleEqualityStyle}>Equality</span>
      </div>
    </div>
  )
}

// ---------- Styles ----------

const containerStyle: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  padding: '2rem',
}

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1rem',
  marginBottom: '1rem',
  flexWrap: 'wrap',
}

const tensionLabelStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--text-faint)',
  marginBottom: '0.3rem',
}

const scenarioTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.35rem',
  color: 'var(--text)',
  lineHeight: 1.25,
}

const teacherControlsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}

const navBtnStyle: React.CSSProperties = {
  padding: '0.45rem 0.85rem',
  fontSize: '0.8rem',
  fontWeight: 600,
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  cursor: 'pointer',
  color: 'var(--text)',
}

const teacherCounterStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--text-dim)',
  padding: '0 0.4rem',
}

const pillsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '1.5rem',
}

const pillStyle: React.CSSProperties = {
  padding: '0.4rem 0.85rem',
  fontSize: '0.78rem',
  fontWeight: 600,
  letterSpacing: '0.03em',
  borderRadius: '999px',
}

const promptBoxStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderLeft: '3px solid var(--text-faint)',
  borderRadius: '0 6px 6px 0',
  padding: '0.85rem 1.1rem',
  fontSize: '0.95rem',
  color: 'var(--text-dim)',
  lineHeight: 1.55,
  marginBottom: '1.5rem',
}

const argsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem',
  marginBottom: '2rem',
}

const argBoxStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '1rem 1.15rem',
}

const argSideStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: '0.45rem',
}

const argLabelStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '0.95rem',
  color: 'var(--text)',
  lineHeight: 1.35,
  marginBottom: '0.55rem',
}

const argTextStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: 'var(--text-dim)',
  lineHeight: 1.6,
}

const sliderWrapStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
}

const sliderEndsRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.6rem',
  fontSize: '0.78rem',
  color: 'var(--text-dim)',
}

const sliderEndLeftStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  maxWidth: '45%',
}

const sliderEndRightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  maxWidth: '45%',
  textAlign: 'right',
}

const sliderEndArrowLibertyStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  color: 'var(--gold)',
  fontWeight: 700,
}

const sliderEndArrowEqualityStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  color: '#2980b9',
  fontWeight: 700,
}

const sliderEndLabelStyle: React.CSSProperties = {
  fontWeight: 600,
  color: 'var(--text)',
  fontSize: '0.85rem',
  lineHeight: 1.3,
}

const trackStyle: React.CSSProperties = {
  position: 'relative',
  height: '70px',
  background: 'linear-gradient(to right, rgba(200, 169, 110, 0.12), rgba(255,255,255,0) 50%, rgba(41, 128, 185, 0.12))',
  border: '1px solid var(--border)',
  borderRadius: '999px',
  outline: 'none',
  touchAction: 'none',
}

const centerMarkStyle: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '15%',
  bottom: '15%',
  width: '1px',
  background: 'var(--border)',
  transform: 'translateX(-50%)',
}

const peerDotStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  width: '14px',
  height: '14px',
  borderRadius: '50%',
  border: '2px solid #fff',
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none',
  zIndex: 2,
}

const myHandleStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  background: 'var(--gold)',
  border: '3px solid #fff',
  boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
  transform: 'translate(-50%, -50%)',
  transition: 'left 0.08s ease',
  zIndex: 5,
}

const scaleRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '0.5rem',
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
}

const scaleLibertyStyle: React.CSSProperties = { color: 'var(--gold)' }
const scaleMiddleStyle: React.CSSProperties = { color: 'var(--text-faint)' }
const scaleEqualityStyle: React.CSSProperties = { color: '#2980b9' }

const footerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '0.65rem',
}

const lockBtnStyle: React.CSSProperties = {
  padding: '0.75rem 1.4rem',
  fontSize: '0.85rem',
  fontWeight: 600,
  letterSpacing: '0.03em',
  color: '#fff',
  background: 'var(--gold)',
  border: 'none',
  borderRadius: '6px',
}

const hintStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  color: 'var(--text-faint)',
  margin: 0,
}

const lockedFooterStyle: React.CSSProperties = {
  paddingTop: '0.75rem',
  borderTop: '1px solid var(--border)',
}

const lockedHeaderStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  fontWeight: 600,
  color: 'var(--text)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.5rem',
}

const anonNoteStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  color: 'var(--text-dim)',
  margin: 0,
  lineHeight: 1.5,
}

const liveDotInline: React.CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: 'var(--gold)',
  display: 'inline-block',
}

const teacherFooterStyle: React.CSSProperties = {
  paddingTop: '0.75rem',
  borderTop: '1px solid var(--border)',
}

const teacherStatStyle: React.CSSProperties = {
  fontSize: '0.92rem',
  fontWeight: 600,
  color: 'var(--text)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}