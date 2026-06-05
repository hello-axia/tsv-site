'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  U1L6ActivityData,
  U1L6Side,
  U1L6Round,
  U1L6PrepData,
  U1L6Argument,
} from '@/content/lessons/u1-l6.meta'

type ActivityStep = 'prep' | 'yes_case' | 'no_echo' | 'no_case' | 'yes_echo' | 'open' | 'closing'

type RawPeerSubmission = {
  student_id: string
  display_name: string | null
  prep: U1L6PrepData
}

type Mode = 'student' | 'teacher' | 'broadcast'

type Props = {
  assignmentId: string
  lessonId: string
  profileId: string
  data: U1L6ActivityData
  mode?: Mode

  // Broadcast mode only.
  broadcastActivityStep?: ActivityStep
  broadcastSideCounts?: { yes: number; no: number }
  broadcastSubmittedCount?: number
}

const STEP_ORDER: ActivityStep[] = [
  'prep',
  'yes_case',
  'no_echo',
  'no_case',
  'yes_echo',
  'open',
  'closing',
]

const STEP_LABELS: Record<ActivityStep, string> = {
  prep: 'Prep',
  yes_case: 'Yes case',
  no_echo: 'No echoes',
  no_case: 'No case',
  yes_echo: 'Yes echoes',
  open: 'Open',
  closing: 'Closing',
}

const DEBATE_STEPS: ActivityStep[] = ['yes_case', 'no_echo', 'no_case', 'yes_echo', 'open']

function isDebateStep(step: ActivityStep): boolean {
  return DEBATE_STEPS.includes(step)
}

const EMPTY_ARGUMENT: U1L6Argument = { claim: '', reason: '', evidence: '' }

function emptyPrepDraft(): {
  assignedSide: U1L6Side | null
  arguments: [U1L6Argument, U1L6Argument]
  predictedOpposing: string
  response: string
} {
  return {
    assignedSide: null,
    arguments: [{ ...EMPTY_ARGUMENT }, { ...EMPTY_ARGUMENT }],
    predictedOpposing: '',
    response: '',
  }
}

export default function U1L6DeliberationActivity({
  assignmentId,
  lessonId,
  profileId,
  data,
  mode = 'student',
  broadcastActivityStep,
  broadcastSideCounts,
  broadcastSubmittedCount,
}: Props) {
  const [activityStep, setActivityStep] = useState<ActivityStep>(
    broadcastActivityStep ?? 'prep'
  )

  const [myPrep, setMyPrep] = useState<U1L6PrepData | null>(null)
  const [draft, setDraft] = useState(emptyPrepDraft())
  const [loadedFromDb, setLoadedFromDb] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [peers, setPeers] = useState<RawPeerSubmission[]>([])
  const [classSize, setClassSize] = useState<number>(0)
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

  // --- Poll activity_state.
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
      const stateObj = (row.activity_state ?? {}) as { activityStep?: ActivityStep }
      setActivityStep(stateObj.activityStep ?? 'prep')
    }

    fetchActivityState()
    const id = setInterval(fetchActivityState, 3000)
    return () => { cancelled = true; clearInterval(id) }
  }, [assignmentId, mode])

  // --- Load student's own submission once.
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
      if (cancelled) return
      if (row?.data) {
        const prep = row.data as U1L6PrepData
        setMyPrep(prep)
      }
      setLoadedFromDb(true)
    })()
    return () => { cancelled = true }
  }, [assignmentId, profileId, mode])

  // --- Teacher mode: poll peer submissions + display names.
  useEffect(() => {
    if (mode !== 'teacher') return
    const supabase = createClient()
    let cancelled = false

    async function fetchPeers() {
      const { data: subs } = await supabase
        .from('activity_submissions')
        .select('data, student_id, profiles(display_name)')
        .eq('assignment_id', assignmentId)
      if (cancelled) return

      const parsed: RawPeerSubmission[] = []
      for (const row of subs ?? []) {
        const prep = row.data as U1L6PrepData
        const profile = row.profiles as unknown as { display_name: string | null } | null
        parsed.push({
          student_id: row.student_id,
          display_name: profile?.display_name ?? null,
          prep,
        })
      }
      parsed.sort((a, b) => (a.display_name ?? '').localeCompare(b.display_name ?? ''))
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

  // --- Student submit (one-shot).
  async function submitPrep() {
    if (mode !== 'student') return
    if (myPrep || submitting) return
    if (!draft.assignedSide) return
    if (draft.arguments[0].claim.trim().length === 0) return

    setSubmitting(true)
    const supabase = createClient()
    const now = new Date().toISOString()

    const prep: U1L6PrepData = {
      assignedSide: draft.assignedSide,
      arguments: [
        {
          claim: draft.arguments[0].claim.trim(),
          reason: draft.arguments[0].reason.trim(),
          evidence: draft.arguments[0].evidence.trim(),
        },
        {
          claim: draft.arguments[1].claim.trim(),
          reason: draft.arguments[1].reason.trim(),
          evidence: draft.arguments[1].evidence.trim(),
        },
      ],
      rebuttal: {
        predictedOpposing: draft.predictedOpposing.trim(),
        response: draft.response.trim(),
      },
      submittedAt: now,
    }

    const { error } = await supabase
      .from('activity_submissions')
      .upsert({
        student_id: profileId,
        assignment_id: assignmentId,
        lesson_id: lessonId,
        activity_type: 'u1_l6_deliberation',
        data: prep,
        submitted_at: now,
      }, { onConflict: 'student_id,assignment_id' })
    if (error) {
      alert(`Could not submit your prep. ${error.message}`)
      setSubmitting(false)
      return
    }
    setMyPrep(prep)
    await supabase
      .from('lesson_progress')
      .upsert({
        student_id: profileId,
        assignment_id: assignmentId,
        lesson_id: lessonId,
        current_step: 'activity',
        activity_submitted_at: now,
      }, { onConflict: 'student_id,assignment_id' })
    setSubmitting(false)
  }

  // --- Teacher: advance phase.
  async function writeActivityStep(nextStep: ActivityStep) {
    if (mode !== 'teacher') return
    const supabase = createClient()
    const { error } = await supabase
      .from('lesson_assignments')
      .update({ activity_state: { activityStep: nextStep } })
      .eq('id', assignmentId)
    if (error) {
      alert(`Could not advance step. ${error.message}`)
      return
    }
    setActivityStep(nextStep)
  }

  // --- Render
  if (mode === 'student') {
    return (
      <StudentView
        data={data}
        activityStep={activityStep}
        myPrep={myPrep}
        draft={draft}
        loaded={loadedFromDb}
        submitting={submitting}
        onChangeDraft={setDraft}
        onSubmit={submitPrep}
      />
    )
  }

  if (mode === 'teacher') {
    const counts = countSides(peers)
    const submittedCount = peers.length
    return (
      <TeacherView
        data={data}
        activityStep={activityStep}
        peers={peers}
        sideCounts={counts}
        submittedCount={submittedCount}
        classSize={classSize}
        onSetStep={writeActivityStep}
        expandedStudent={expandedStudent}
        onExpand={setExpandedStudent}
      />
    )
  }

  return (
    <BroadcastView
      data={data}
      activityStep={broadcastActivityStep ?? 'prep'}
      sideCounts={broadcastSideCounts ?? { yes: 0, no: 0 }}
      submittedCount={broadcastSubmittedCount ?? 0}
    />
  )
}

// ---------- helpers ----------

function countSides(peers: RawPeerSubmission[]): { yes: number; no: number } {
  return {
    yes: peers.filter(p => p.prep?.assignedSide === 'yes').length,
    no: peers.filter(p => p.prep?.assignedSide === 'no').length,
  }
}

function roundForStep(data: U1L6ActivityData, step: ActivityStep): U1L6Round | null {
  if (!isDebateStep(step)) return null
  return data.rounds.find(r => r.step === step) ?? null
}

function sideName(data: U1L6ActivityData, side: U1L6Side): string {
  return side === 'yes' ? 'Yes' : 'No'
}

// ---------- Student view ----------

function StudentView({
  data, activityStep, myPrep, draft, loaded, submitting, onChangeDraft, onSubmit,
}: {
  data: U1L6ActivityData
  activityStep: ActivityStep
  myPrep: U1L6PrepData | null
  draft: ReturnType<typeof emptyPrepDraft>
  loaded: boolean
  submitting: boolean
  onChangeDraft: (d: ReturnType<typeof emptyPrepDraft>) => void
  onSubmit: () => void
}) {
  if (!loaded) {
    return <div style={containerStyle}><p style={{ color: 'var(--text-faint)' }}>Loading…</p></div>
  }

  // Question banner is shown in every phase.
  const questionBanner = (
    <div style={instructionStyle}>
      <div style={tensionFlagStyle}>Six Tensions · {data.tension}</div>
      <p style={{ margin: 0 }}>{data.question}</p>
    </div>
  )

  // --- PREP PHASE: not yet submitted → show the form.
  if (activityStep === 'prep' && !myPrep) {
    return (
      <div style={containerStyle}>
        {questionBanner}
        <PrepForm
          data={data}
          draft={draft}
          submitting={submitting}
          onChange={onChangeDraft}
          onSubmit={onSubmit}
        />
      </div>
    )
  }

  // --- PREP PHASE but already submitted → confirmation + read-back.
  if (activityStep === 'prep' && myPrep) {
    return (
      <div style={containerStyle}>
        {questionBanner}
        <div style={submittedFooterStyle}>
          <strong>✓ Prep submitted.</strong>{' '}
          You&rsquo;re arguing the <strong>{sideName(data, myPrep.assignedSide)}</strong> side. Wait for your teacher to start the debate — your prep stays on screen for reference.
        </div>
        <MyPrepReadback data={data} prep={myPrep} />
      </div>
    )
  }

  // --- DEBATE PHASES.
  // The student's device stays on their own prep the whole debate. The round
  // choreography (whose turn it is) lives on the projector, not here — replacing
  // their notes mid-debate is exactly the bug we're fixing.
  if (isDebateStep(activityStep)) {
    return (
      <div style={containerStyle}>
        {questionBanner}
        <div style={debateNudgeStyle}>
          The debate is underway — follow the rounds on the projector. Your prep stays here for reference.
        </div>
        {myPrep
          ? <MyPrepReadback data={data} prep={myPrep} />
          : (
            <div style={waitingNoteStyle}>
              You didn&rsquo;t submit prep before the debate started. Argue your assigned side from your notes — and add your real view in the Ledger at the end.
            </div>
          )}
      </div>
    )
  }

  // --- CLOSING.
  return (
    <div style={containerStyle}>
      {questionBanner}
      <ClosingCard questions={data.closingQuestions} />
      {myPrep && <MyPrepReadback data={data} prep={myPrep} collapsedByDefault />}
    </div>
  )
}

function PrepForm({
  data, draft, submitting, onChange, onSubmit,
}: {
  data: U1L6ActivityData
  draft: ReturnType<typeof emptyPrepDraft>
  submitting: boolean
  onChange: (d: ReturnType<typeof emptyPrepDraft>) => void
  onSubmit: () => void
}) {
  function setSide(side: U1L6Side) {
    onChange({ ...draft, assignedSide: side })
  }
  function setArg(index: 0 | 1, field: keyof U1L6Argument, value: string) {
    const next = draft.arguments.map((a, i) =>
      i === index ? { ...a, [field]: value } : a
    ) as [U1L6Argument, U1L6Argument]
    onChange({ ...draft, arguments: next })
  }

  const canSubmit =
    !submitting &&
    draft.assignedSide !== null &&
    draft.arguments[0].claim.trim().length > 0

  return (
    <>
      {/* Assigned side */}
      <div style={prepSectionStyle}>
        <div style={prepSectionLabelStyle}>Which side were you assigned?</div>
        <p style={prepHelperStyle}>
          Your teacher counted the class off. Record the side you were assigned — you&rsquo;re arguing this side whether or not you agree with it.
        </p>
        <div style={sideToggleRowStyle}>
          {(['yes', 'no'] as U1L6Side[]).map(side => {
            const selected = draft.assignedSide === side
            return (
              <button
                key={side}
                onClick={() => setSide(side)}
                style={{
                  ...sideToggleBtnStyle,
                  background: selected ? 'var(--gold)' : 'var(--bg2)',
                  color: selected ? '#fff' : 'var(--text)',
                  border: `2px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
                }}
              >
                <span style={sideToggleTitleStyle}>{side === 'yes' ? 'YES' : 'NO'}</span>
                <span style={sideToggleSubStyle}>{data.sideLabels[side]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Arguments */}
      <div style={prepSectionStyle}>
        <div style={prepSectionLabelStyle}>Your two strongest arguments</div>
        <p style={prepHelperStyle}>
          Each argument needs a clear claim, a reason it&rsquo;s true, and an example or piece of evidence — from the background sheet or your own knowledge.
        </p>
        {[0, 1].map(i => {
          const idx = i as 0 | 1
          const arg = draft.arguments[idx]
          return (
            <div key={i} style={argBlockStyle}>
              <div style={argNumStyle}>Argument {i + 1}</div>
              <FieldInput
                label="Claim"
                placeholder="What are you arguing?"
                value={arg.claim}
                onChange={v => setArg(idx, 'claim', v)}
                rows={2}
              />
              <FieldInput
                label="Reason"
                placeholder="Why is this claim true?"
                value={arg.reason}
                onChange={v => setArg(idx, 'reason', v)}
                rows={2}
              />
              <FieldInput
                label="Evidence"
                placeholder="An example or piece of evidence that supports it"
                value={arg.evidence}
                onChange={v => setArg(idx, 'evidence', v)}
                rows={2}
              />
            </div>
          )
        })}
      </div>

      {/* Predicted rebuttal */}
      <div style={prepSectionStyle}>
        <div style={prepSectionLabelStyle}>Predict the other side</div>
        <p style={prepHelperStyle}>
          What&rsquo;s the strongest argument the <strong>other</strong> side will make? Don&rsquo;t strawman it — write it the way they&rsquo;d say it. Then write how you&rsquo;d respond.
        </p>
        <FieldInput
          label="Their strongest argument"
          placeholder="What will the other side argue?"
          value={draft.predictedOpposing}
          onChange={v => onChange({ ...draft, predictedOpposing: v })}
          rows={3}
        />
        <FieldInput
          label="Your response"
          placeholder="How would you answer it?"
          value={draft.response}
          onChange={v => onChange({ ...draft, response: v })}
          rows={3}
        />
      </div>

      {/* Submit */}
      <div style={submitFooterStyle}>
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          style={{
            ...submitBtnStyle,
            opacity: !canSubmit ? 0.5 : 1,
            cursor: !canSubmit ? 'default' : 'pointer',
          }}
        >
          {submitting ? 'Submitting…' : 'Submit my prep'}
        </button>
        <p style={submitHintStyle}>
          {draft.assignedSide === null
            ? 'Pick the side you were assigned to continue.'
            : draft.arguments[0].claim.trim().length === 0
              ? 'Write at least your first claim before submitting.'
              : "You can't edit after you submit. Fill in what you can."}
        </p>
      </div>
    </>
  )
}

function FieldInput({
  label, placeholder, value, onChange, rows,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  rows: number
}) {
  return (
    <div style={fieldWrapStyle}>
      <label style={fieldLabelStyle}>{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={fieldTextareaStyle}
      />
    </div>
  )
}

function MyPrepReadback({
  data, prep, collapsedByDefault = false,
}: {
  data: U1L6ActivityData
  prep: U1L6PrepData
  collapsedByDefault?: boolean
}) {
  const [open, setOpen] = useState(!collapsedByDefault)
  return (
    <div style={readbackStyle}>
      <button onClick={() => setOpen(!open)} style={readbackToggleStyle}>
        <span>Your prep — {sideName(data, prep.assignedSide)} side</span>
        <span style={{ color: 'var(--text-faint)' }}>{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div style={readbackBodyStyle}>
          {prep.arguments.map((arg, i) => (
            <div key={i} style={readbackArgStyle}>
              <div style={readbackArgNumStyle}>Argument {i + 1}</div>
              {arg.claim && <p style={readbackLineStyle}><strong>Claim:</strong> {arg.claim}</p>}
              {arg.reason && <p style={readbackLineStyle}><strong>Reason:</strong> {arg.reason}</p>}
              {arg.evidence && <p style={readbackLineStyle}><strong>Evidence:</strong> {arg.evidence}</p>}
            </div>
          ))}
          {(prep.rebuttal.predictedOpposing || prep.rebuttal.response) && (
            <div style={readbackArgStyle}>
              <div style={readbackArgNumStyle}>Predicted rebuttal</div>
              {prep.rebuttal.predictedOpposing && (
                <p style={readbackLineStyle}><strong>They&rsquo;ll argue:</strong> {prep.rebuttal.predictedOpposing}</p>
              )}
              {prep.rebuttal.response && (
                <p style={readbackLineStyle}><strong>Your response:</strong> {prep.rebuttal.response}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RoundCard({
  data, round, myPrep,
}: {
  data: U1L6ActivityData
  round: U1L6Round
  myPrep: U1L6PrepData | null
}) {
  // Is this student's side the one actively speaking?
  const mySide = myPrep?.assignedSide
  const isMyTurn =
    round.activeSide === 'both' ||
    (mySide != null && round.activeSide === mySide)

  return (
    <div style={roundCardStyle}>
      <div style={roundHeadStyle}>{round.headline}</div>
      <p style={roundInstructionStyle}>{round.instruction}</p>
      {mySide != null && (
        <div style={{
          ...turnFlagStyle,
          background: isMyTurn ? 'rgba(200, 169, 110, 0.12)' : 'var(--bg2)',
          borderColor: isMyTurn ? 'var(--gold)' : 'var(--border)',
        }}>
          {round.activeSide === 'both'
            ? 'Open floor — your side is in it.'
            : isMyTurn
              ? `Your turn — you're on the ${sideName(data, mySide)} side.`
              : `Listening — the ${sideName(data, round.activeSide as U1L6Side)} side has the floor.`}
        </div>
      )}
    </div>
  )
}

function ClosingCard({ questions }: { questions: string[] }) {
  return (
    <div style={closingCardStyle}>
      <div style={closingLabelStyle}>Closing — weigh the tradeoff</div>
      <ol style={closingListStyle}>
        {questions.map((q, i) => (
          <li key={i} style={closingItemStyle}>{q}</li>
        ))}
      </ol>
      <p style={closingTailStyle}>
        Then open your Ledger. The question there isn&rsquo;t which side won — it&rsquo;s where <em>you</em> actually land.
      </p>
    </div>
  )
}

// ---------- Teacher view ----------

function TeacherView({
  data, activityStep, peers, sideCounts, submittedCount, classSize,
  onSetStep, expandedStudent, onExpand,
}: {
  data: U1L6ActivityData
  activityStep: ActivityStep
  peers: RawPeerSubmission[]
  sideCounts: { yes: number; no: number }
  submittedCount: number
  classSize: number
  onSetStep: (step: ActivityStep) => void
  expandedStudent: string | null
  onExpand: (id: string | null) => void
}) {
  const currentStepIndex = STEP_ORDER.indexOf(activityStep)
  const canPrev = currentStepIndex > 0
  const canNext = currentStepIndex < STEP_ORDER.length - 1
  const round = roundForStep(data, activityStep)

  const yesPeers = peers.filter(p => p.prep?.assignedSide === 'yes')
  const noPeers = peers.filter(p => p.prep?.assignedSide === 'no')

  return (
    <div style={containerStyle}>
      {/* Phase controls */}
      <div style={teacherSectionStyle}>
        <div style={teacherSectionLabelStyle}>Activity phase</div>
        <div style={stepRowStyle}>
          {STEP_ORDER.map(step => {
            const isActive = step === activityStep
            return (
              <button
                key={step}
                onClick={() => onSetStep(step)}
                style={{
                  ...stepPillStyle,
                  background: isActive ? '#2980b9' : 'var(--bg2)',
                  color: isActive ? '#fff' : 'var(--text-dim)',
                  border: `1px solid ${isActive ? '#2980b9' : 'var(--border)'}`,
                }}
              >
                {isActive ? '● ' : ''}{STEP_LABELS[step]}
              </button>
            )
          })}
        </div>
        <div style={stepNavRowStyle}>
          <button
            onClick={() => canPrev && onSetStep(STEP_ORDER[currentStepIndex - 1])}
            disabled={!canPrev}
            style={{ ...stepNavBtnStyle, opacity: canPrev ? 1 : 0.4, cursor: canPrev ? 'pointer' : 'not-allowed' }}
          >
            ← Prev
          </button>
          <button
            onClick={() => canNext && onSetStep(STEP_ORDER[currentStepIndex + 1])}
            disabled={!canNext}
            style={{ ...stepNavBtnStyle, opacity: canNext ? 1 : 0.4, cursor: canNext ? 'pointer' : 'not-allowed' }}
          >
            Next →
          </button>
        </div>
        {round && (
          <div style={teacherRoundHintStyle}>
            <strong>{round.headline}.</strong> {round.instruction}
          </div>
        )}
      </div>

      {/* Live counters */}
      <div style={teacherSectionStyle}>
        <div style={teacherSectionLabelStyle}>Class state</div>
        <div style={statsRowStyle}>
          <div style={statBlockStyle}>
            <div style={teacherStatLabelStyle}>Yes side</div>
            <div style={teacherStatNumStyle}>{sideCounts.yes}</div>
          </div>
          <div style={statBlockStyle}>
            <div style={teacherStatLabelStyle}>No side</div>
            <div style={teacherStatNumStyle}>{sideCounts.no}</div>
          </div>
          <div style={statBlockStyle}>
            <div style={teacherStatLabelStyle}>Prep submitted</div>
            <div style={teacherStatNumStyle}>{submittedCount} / {classSize || '?'}</div>
          </div>
        </div>
      </div>

      {/* Prep mirror, grouped by side */}
      <div style={teacherSectionStyle}>
        <div style={teacherSectionLabelStyle}>Prep — Yes side</div>
        <PrepGroup peers={yesPeers} expandedStudent={expandedStudent} onExpand={onExpand} />
      </div>
      <div style={teacherSectionStyle}>
        <div style={teacherSectionLabelStyle}>Prep — No side</div>
        <PrepGroup peers={noPeers} expandedStudent={expandedStudent} onExpand={onExpand} />
      </div>
    </div>
  )
}

function PrepGroup({
  peers, expandedStudent, onExpand,
}: {
  peers: RawPeerSubmission[]
  expandedStudent: string | null
  onExpand: (id: string | null) => void
}) {
  if (peers.length === 0) {
    return <p style={{ color: 'var(--text-faint)', fontSize: '0.9rem', margin: 0 }}>No prep submitted on this side yet.</p>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {peers.map(peer => {
        const isExpanded = expandedStudent === peer.student_id
        const prep = peer.prep
        const argCount = prep.arguments.filter(a => a.claim.trim().length > 0).length
        return (
          <div key={peer.student_id} style={teacherRowStyle}>
            <button
              onClick={() => onExpand(isExpanded ? null : peer.student_id)}
              style={teacherRowHeadStyle}
            >
              <span style={{ fontWeight: 600 }}>{peer.display_name ?? '(unnamed)'}</span>
              <span style={teacherRowMetaStyle}>
                <span style={{ color: 'var(--text-faint)' }}>{argCount} of 2 args</span>
                <span style={{ color: 'var(--text-faint)' }}>{isExpanded ? '▴' : '▾'}</span>
              </span>
            </button>
            {isExpanded && (
              <div style={teacherRowBodyStyle}>
                {prep.arguments.map((arg, i) => (
                  arg.claim.trim().length > 0 && (
                    <div key={i} style={teacherArgStyle}>
                      <div style={teacherArgNumStyle}>Argument {i + 1}</div>
                      <p style={teacherArgLineStyle}><strong>Claim:</strong> {arg.claim}</p>
                      {arg.reason && <p style={teacherArgLineStyle}><strong>Reason:</strong> {arg.reason}</p>}
                      {arg.evidence && <p style={teacherArgLineStyle}><strong>Evidence:</strong> {arg.evidence}</p>}
                    </div>
                  )
                ))}
                {(prep.rebuttal.predictedOpposing || prep.rebuttal.response) && (
                  <div style={teacherArgStyle}>
                    <div style={teacherArgNumStyle}>Predicted rebuttal</div>
                    {prep.rebuttal.predictedOpposing && (
                      <p style={teacherArgLineStyle}><strong>They&rsquo;ll argue:</strong> {prep.rebuttal.predictedOpposing}</p>
                    )}
                    {prep.rebuttal.response && (
                      <p style={teacherArgLineStyle}><strong>Response:</strong> {prep.rebuttal.response}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------- Broadcast fallback ----------

function BroadcastView({
  data, activityStep, sideCounts, submittedCount,
}: {
  data: U1L6ActivityData
  activityStep: ActivityStep
  sideCounts: { yes: number; no: number }
  submittedCount: number
}) {
  const round = roundForStep(data, activityStep)
  return (
    <div style={containerStyle}>
      <div>
        Phase: {STEP_LABELS[activityStep]} · Yes: {sideCounts.yes} · No: {sideCounts.no} · Prep: {submittedCount}
      </div>
      {round && <div><strong>{round.headline}</strong> — {round.instruction}</div>}
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

const instructionStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderLeft: '3px solid var(--gold)',
  borderRadius: '0 8px 8px 0',
  padding: '1rem 1.25rem',
  marginBottom: '1.5rem',
  fontSize: '0.95rem',
  color: 'var(--text-dim)',
  lineHeight: 1.65,
}

const tensionFlagStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  marginBottom: '0.55rem',
}

// --- Prep form ---

const prepSectionStyle: React.CSSProperties = {
  marginBottom: '1.75rem',
}

const prepSectionLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.1rem',
  color: 'var(--text)',
  marginBottom: '0.4rem',
}

const prepHelperStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  color: 'var(--text-dim)',
  lineHeight: 1.6,
  margin: '0 0 1rem',
}

const sideToggleRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  flexWrap: 'wrap',
}

const sideToggleBtnStyle: React.CSSProperties = {
  flex: '1 1 12rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '0.3rem',
  padding: '1rem 1.25rem',
  borderRadius: '10px',
  textAlign: 'left',
  font: 'inherit',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
}

const sideToggleTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.05rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
}

const sideToggleSubStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  opacity: 0.85,
  lineHeight: 1.35,
}

const argBlockStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '1.25rem 1.4rem',
  marginBottom: '1rem',
}

const argNumStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  marginBottom: '0.8rem',
}

const fieldWrapStyle: React.CSSProperties = {
  marginBottom: '0.85rem',
}

const fieldLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text-dim)',
  marginBottom: '0.35rem',
}

const fieldTextareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  fontFamily: 'inherit',
  fontSize: '0.92rem',
  lineHeight: 1.6,
  color: 'var(--text)',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  resize: 'vertical',
}

const submitFooterStyle: React.CSSProperties = {
  marginTop: '0.5rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '0.65rem',
}

const submitBtnStyle: React.CSSProperties = {
  padding: '0.85rem 1.6rem',
  fontSize: '0.9rem',
  fontWeight: 600,
  letterSpacing: '0.03em',
  color: '#fff',
  background: 'var(--gold)',
  border: 'none',
  borderRadius: '6px',
  font: 'inherit',
}

const submitHintStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  color: 'var(--text-faint)',
  margin: 0,
}

const submittedFooterStyle: React.CSSProperties = {
  padding: '1rem 1.25rem',
  marginBottom: '1.25rem',
  background: 'rgba(47, 93, 98, 0.08)',
  border: '1px solid #2f5d62',
  borderRadius: '8px',
  fontSize: '0.92rem',
  color: 'var(--text)',
  lineHeight: 1.55,
}

// --- Readback ---

const readbackStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  overflow: 'hidden',
}

const readbackToggleStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.85rem 1.2rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontFamily: 'var(--font-display)',
  fontSize: '0.95rem',
  color: 'var(--text)',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  font: 'inherit',
  textAlign: 'left',
}

const readbackBodyStyle: React.CSSProperties = {
  padding: '0 1.2rem 1.1rem',
  borderTop: '1px solid var(--border)',
}

const readbackArgStyle: React.CSSProperties = {
  marginTop: '1rem',
}

const readbackArgNumStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  marginBottom: '0.5rem',
}

const readbackLineStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: 'var(--text)',
    lineHeight: 1.6,
    margin: '0 0 0.4rem',
  }
  
  const debateNudgeStyle: React.CSSProperties = {
    background: 'rgba(41, 128, 185, 0.06)',
    border: '1px solid rgba(41, 128, 185, 0.25)',
    borderRadius: '8px',
    padding: '0.85rem 1.2rem',
    marginBottom: '1.25rem',
    fontSize: '0.9rem',
    color: 'var(--text-dim)',
    lineHeight: 1.55,
  }
  
  const waitingNoteStyle: React.CSSProperties = {
    background: 'var(--bg2)',
    border: '1px dashed var(--border)',
    borderRadius: '6px',
    padding: '0.7rem 1rem',
    marginBottom: '1.25rem',
    fontSize: '0.88rem',
    color: 'var(--text-dim)',
    fontStyle: 'italic',
  }

// --- Round card ---

const roundCardStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '1.5rem 1.75rem',
  marginBottom: '1.5rem',
}

const roundHeadStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.3rem',
  color: 'var(--text)',
  marginBottom: '0.7rem',
  lineHeight: 1.25,
}

const roundInstructionStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  color: 'var(--text-dim)',
  lineHeight: 1.7,
  margin: '0 0 1rem',
}

const turnFlagStyle: React.CSSProperties = {
  padding: '0.7rem 1rem',
  borderRadius: '6px',
  border: '1px solid var(--border)',
  fontSize: '0.9rem',
  fontWeight: 600,
  color: 'var(--text)',
}

// --- Closing ---

const closingCardStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderLeft: '3px solid var(--gold)',
  borderRadius: '0 10px 10px 0',
  padding: '1.5rem 1.75rem',
  marginBottom: '1.5rem',
}

const closingLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.2rem',
  color: 'var(--text)',
  marginBottom: '0.9rem',
}

const closingListStyle: React.CSSProperties = {
  margin: '0 0 1rem',
  paddingLeft: '1.2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
}

const closingItemStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  color: 'var(--text)',
  lineHeight: 1.55,
}

const closingTailStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: 'var(--text-dim)',
  lineHeight: 1.65,
  margin: 0,
}

// --- Teacher styles ---

const teacherSectionStyle: React.CSSProperties = {
  marginBottom: '1.75rem',
}

const teacherSectionLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#2980b9',
  marginBottom: '0.7rem',
}

const stepRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
  marginBottom: '0.7rem',
}

const stepPillStyle: React.CSSProperties = {
  padding: '0.5rem 0.95rem',
  fontSize: '0.82rem',
  fontWeight: 600,
  letterSpacing: '0.02em',
  borderRadius: '999px',
  cursor: 'pointer',
  font: 'inherit',
}

const stepNavRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
}

const stepNavBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.82rem',
  fontWeight: 600,
  color: 'var(--text-dim)',
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  font: 'inherit',
}

const teacherRoundHintStyle: React.CSSProperties = {
  marginTop: '0.85rem',
  padding: '0.7rem 1rem',
  background: 'rgba(41, 128, 185, 0.06)',
  border: '1px solid rgba(41, 128, 185, 0.25)',
  borderRadius: '6px',
  fontSize: '0.85rem',
  color: 'var(--text-dim)',
  lineHeight: 1.55,
}

const statsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1.5rem',
  flexWrap: 'wrap',
}

const statBlockStyle: React.CSSProperties = {
  minWidth: '7rem',
}

const teacherStatLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-faint)',
  marginBottom: '0.3rem',
}

const teacherStatNumStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.4rem',
  color: 'var(--text)',
}

const teacherRowStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  overflow: 'hidden',
}

const teacherRowHeadStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '0.9rem',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
  font: 'inherit',
  color: 'var(--text)',
}

const teacherRowMetaStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.85rem',
  fontSize: '0.82rem',
}

const teacherRowBodyStyle: React.CSSProperties = {
  padding: '0.85rem 1rem 1rem',
  borderTop: '1px solid var(--border)',
  background: 'var(--bg)',
}

const teacherArgStyle: React.CSSProperties = {
  marginBottom: '0.85rem',
}

const teacherArgNumStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-faint)',
  marginBottom: '0.4rem',
}

const teacherArgLineStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  color: 'var(--text)',
  lineHeight: 1.6,
  margin: '0 0 0.35rem',
}