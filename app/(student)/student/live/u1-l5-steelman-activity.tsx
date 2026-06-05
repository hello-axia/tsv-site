'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { U1L5ActivityData, U1L5Side, U1L5Case } from '@/content/lessons/u1-l5.meta'

type ActivityStep = 'pick_side' | 'read_and_write' | 'pair_share' | 'closing'

type U1L5Submission = {
  side?: U1L5Side
  sidePickedAt?: string
  steelman?: {
    text: string
    submittedAt: string
  }
}

type RawPeerSubmission = {
  student_id: string
  display_name: string | null
  submission: U1L5Submission
}

type Mode = 'student' | 'teacher' | 'broadcast'

type Props = {
  assignmentId: string
  lessonId: string
  profileId: string
  data: U1L5ActivityData
  mode?: Mode

  // Broadcast mode only.
  broadcastActivityStep?: ActivityStep
  broadcastSidePicks?: { side: U1L5Side; count: number }[]
  broadcastSubmittedCount?: number
}

const STEP_ORDER: ActivityStep[] = ['pick_side', 'read_and_write', 'pair_share', 'closing']
const STEP_LABELS: Record<ActivityStep, string> = {
  pick_side: 'Pick side',
  read_and_write: 'Read & write',
  pair_share: 'Pair share',
  closing: 'Closing',
}

export default function U1L5SteelmanActivity({
  assignmentId,
  lessonId,
  profileId,
  data,
  mode = 'student',
  broadcastActivityStep,
  broadcastSidePicks,
  broadcastSubmittedCount,
}: Props) {
  const [activityStep, setActivityStep] = useState<ActivityStep>(
    broadcastActivityStep ?? 'pick_side'
  )

  const [mySubmission, setMySubmission] = useState<U1L5Submission>({})
  const [steelmanDraft, setSteelmanDraft] = useState<string>('')
  const [loadedFromDb, setLoadedFromDb] = useState(false)
  const [submittingSide, setSubmittingSide] = useState(false)
  const [submittingSteelman, setSubmittingSteelman] = useState(false)

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
      setActivityStep(stateObj.activityStep ?? 'pick_side')
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
        const sub = row.data as U1L5Submission
        setMySubmission(sub)
        if (sub.steelman?.text) {
          setSteelmanDraft(sub.steelman.text)
        }
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
        const d = row.data as U1L5Submission
        const profile = row.profiles as unknown as { display_name: string | null } | null
        parsed.push({
          student_id: row.student_id,
          display_name: profile?.display_name ?? null,
          submission: d,
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

  // --- Student handlers
  async function pickSide(side: U1L5Side) {
    if (mode !== 'student' || mySubmission.side || submittingSide) return
    setSubmittingSide(true)
    const supabase = createClient()
    const now = new Date().toISOString()
    const nextSub: U1L5Submission = { side, sidePickedAt: now }
    const { error } = await supabase
      .from('activity_submissions')
      .upsert({
        student_id: profileId,
        assignment_id: assignmentId,
        lesson_id: lessonId,
        activity_type: 'u1_l5_steelman',
        data: nextSub,
        submitted_at: now,
      }, { onConflict: 'student_id,assignment_id' })
    if (error) {
      alert(`Could not record your pick. ${error.message}`)
      setSubmittingSide(false)
      return
    }
    setMySubmission(nextSub)
    setSubmittingSide(false)
  }

  async function submitSteelman() {
    if (mode !== 'student') return
    if (!mySubmission.side || mySubmission.steelman || submittingSteelman) return
    if (activityStep !== 'read_and_write' && activityStep !== 'pair_share') return
    const trimmed = steelmanDraft.trim()
    if (trimmed.length === 0) return

    setSubmittingSteelman(true)
    const supabase = createClient()
    const now = new Date().toISOString()
    const nextSub: U1L5Submission = {
      ...mySubmission,
      steelman: { text: trimmed, submittedAt: now },
    }
    const { error } = await supabase
      .from('activity_submissions')
      .upsert({
        student_id: profileId,
        assignment_id: assignmentId,
        lesson_id: lessonId,
        activity_type: 'u1_l5_steelman',
        data: nextSub,
        submitted_at: now,
      }, { onConflict: 'student_id,assignment_id' })
    if (error) {
      alert(`Could not submit your steelman. ${error.message}`)
      setSubmittingSteelman(false)
      return
    }
    setMySubmission(nextSub)
    await supabase
      .from('lesson_progress')
      .upsert({
        student_id: profileId,
        assignment_id: assignmentId,
        lesson_id: lessonId,
        current_step: 'activity',
        activity_submitted_at: now,
      }, { onConflict: 'student_id,assignment_id' })
    setSubmittingSteelman(false)
  }

  // --- Teacher handlers
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
        mySubmission={mySubmission}
        steelmanDraft={steelmanDraft}
        loaded={loadedFromDb}
        submittingSide={submittingSide}
        submittingSteelman={submittingSteelman}
        onPickSide={pickSide}
        onChangeSteelman={setSteelmanDraft}
        onSubmitSteelman={submitSteelman}
      />
    )
  }

  if (mode === 'teacher') {
    const sidePicks = countSidePicks(peers)
    const steelmanSubmittedCount = peers.filter(p => p.submission.steelman).length
    return (
      <TeacherView
        data={data}
        activityStep={activityStep}
        peers={peers}
        sidePicks={sidePicks}
        steelmanSubmittedCount={steelmanSubmittedCount}
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
      activityStep={broadcastActivityStep ?? 'pick_side'}
      sidePicks={broadcastSidePicks ?? []}
      submittedCount={broadcastSubmittedCount ?? 0}
    />
  )
}

// ---------- helpers ----------

function countSidePicks(peers: RawPeerSubmission[]): { side: U1L5Side; count: number }[] {
  const federal = peers.filter(p => p.submission.side === 'federal').length
  const state = peers.filter(p => p.submission.side === 'state').length
  return [
    { side: 'federal', count: federal },
    { side: 'state',   count: state },
  ]
}

function oppositeSide(side: U1L5Side): U1L5Side {
  return side === 'federal' ? 'state' : 'federal'
}

// ---------- Student view ----------

function StudentView({
  data, activityStep, mySubmission, steelmanDraft, loaded,
  submittingSide, submittingSteelman, onPickSide, onChangeSteelman, onSubmitSteelman,
}: {
  data: U1L5ActivityData
  activityStep: ActivityStep
  mySubmission: U1L5Submission
  steelmanDraft: string
  loaded: boolean
  submittingSide: boolean
  submittingSteelman: boolean
  onPickSide: (side: U1L5Side) => void
  onChangeSteelman: (v: string) => void
  onSubmitSteelman: () => void
}) {
  if (!loaded) {
    return <div style={containerStyle}><p style={{ color: 'var(--text-faint)' }}>Loading…</p></div>
  }

  // Phase 1: no side picked yet — show poll question + vote buttons.
  if (!mySubmission.side) {
    return (
      <div style={containerStyle}>
        <div style={instructionStyle}>
          <div style={tensionFlagStyle}>Six Tensions · {data.tension}</div>
          <p style={{ margin: 0 }}>{data.pollQuestion}</p>
        </div>

        <div style={pollPromptStyle}>Vote: which level of government should hold the authority?</div>

        <div style={pollOptionsStyle}>
          {data.pollOptions.map(opt => (
            <button
              key={opt.side}
              onClick={() => onPickSide(opt.side)}
              disabled={submittingSide}
              style={{
                ...pollOptionBtnStyle,
                opacity: submittingSide ? 0.5 : 1,
                cursor: submittingSide ? 'default' : 'pointer',
              }}
            >
              <span style={pollOptionLabelStyle}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Phase 2+: side picked. Show opposing case + write area.
  const mySide = mySubmission.side
  const opposing = oppositeSide(mySide)
  const opposingCase = data.cases.find(c => c.side === opposing)!
  const isSubmitted = !!mySubmission.steelman
  const submitEnabled =
    !isSubmitted &&
    !submittingSteelman &&
    (activityStep === 'read_and_write' || activityStep === 'pair_share') &&
    steelmanDraft.trim().length > 0

  return (
    <div style={containerStyle}>
      <div style={pickedBannerStyle}>
        You picked <strong>{sideDisplayName(mySide)}</strong>. Your job now is to write the strongest possible case for <strong>{sideDisplayName(opposing)}</strong>. Not your view — theirs.
      </div>

      {/* Opposing case */}
      <CaseCard caseData={opposingCase} mode="opposing" />

      {/* Writing area */}
      {activityStep === 'pick_side' && (
        <div style={waitingNoteStyle}>
          You picked your side. The writing area opens when your teacher starts the read &amp; write phase.
        </div>
      )}

      {(activityStep === 'read_and_write' || activityStep === 'pair_share' || activityStep === 'closing') && (
        <SteelmanBox
          opposingLabel={sideDisplayName(opposing)}
          value={isSubmitted ? (mySubmission.steelman?.text ?? '') : steelmanDraft}
          locked={isSubmitted || activityStep === 'closing'}
          onChange={onChangeSteelman}
        />
      )}

      {/* Submit / submitted footer */}
      {!isSubmitted && activityStep !== 'closing' && (
        <div style={submitFooterStyle}>
          <button
            onClick={onSubmitSteelman}
            disabled={!submitEnabled}
            style={{
              ...submitBtnStyle,
              opacity: !submitEnabled ? 0.5 : 1,
              cursor: !submitEnabled ? 'default' : 'pointer',
            }}
          >
            {submittingSteelman ? 'Submitting…' : 'Submit my steelman'}
          </button>
          <p style={submitHintStyle}>
            {activityStep === 'pick_side'
              ? 'Wait for your teacher to start the read & write phase.'
              : "You can't edit after you submit. Take your time."}
          </p>
        </div>
      )}

      {isSubmitted && activityStep === 'read_and_write' && (
        <div style={submittedFooterStyle}>
          <strong>✓ Submitted.</strong>{' '}
          Wait for your teacher to start the pair share.
        </div>
      )}

      {/* Pair share guidance */}
      {activityStep === 'pair_share' && isSubmitted && (
        <PairShareGuide
          mySide={mySide}
          opposing={opposing}
          prompts={data.pairSharePrompts}
        />
      )}

      {/* Closing card */}
      {activityStep === 'closing' && (
        <ClosingCard />
      )}
    </div>
  )
}

function sideDisplayName(side: U1L5Side): string {
  return side === 'federal' ? 'Federal authority' : 'State authority'
}

function CaseCard({ caseData, mode }: { caseData: U1L5Case; mode: 'opposing' | 'own' | 'reference' }) {
  const paragraphs = caseData.body.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
  return (
    <div style={caseCardStyle}>
      <div style={caseHeadStyle}>
        <span style={caseFlagStyle}>
          {mode === 'opposing' ? "The side you'll argue for" : caseData.label}
        </span>
        <h3 style={caseTitleStyle}>{caseData.label}</h3>
      </div>
      {paragraphs.map((p, i) => (
        <p key={i} style={caseParaStyle}>{p}</p>
      ))}
    </div>
  )
}

function SteelmanBox({
  opposingLabel, value, locked, onChange,
}: {
  opposingLabel: string
  value: string
  locked: boolean
  onChange: (v: string) => void
}) {
  return (
    <div style={writeBoxStyle}>
      <div style={writeBoxLabelStyle}>Your steelman</div>
      <p style={writeBoxHelperStyle}>
        Write the strongest possible version of the case for <strong>{opposingLabel}</strong>. The goal is for someone who actually holds this view to read what you wrote and recognize their own position — not a cartoon of it.
      </p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={locked}
        rows={12}
        placeholder="Write the strongest version of the case here…"
        style={{
          ...writeTextareaStyle,
          background: locked ? 'var(--bg2)' : 'var(--bg)',
          cursor: locked ? 'default' : 'text',
        }}
      />
    </div>
  )
}

function PairShareGuide({
  mySide, opposing, prompts,
}: {
  mySide: U1L5Side
  opposing: U1L5Side
  prompts: string[]
}) {
  return (
    <div style={pairBoxStyle}>
      <div style={pairBoxLabelStyle}>Pair share</div>
      <p style={pairBoxHelperStyle}>
        Find a partner who picked <strong>{sideDisplayName(opposing)}</strong> — the side you just wrote for. Trade screens. Read what your partner wrote about <strong>{sideDisplayName(mySide)}</strong> — your actual view.
      </p>
      <div style={pairPromptsLabelStyle}>Then discuss</div>
      <ol style={pairPromptsListStyle}>
        {prompts.map((p, i) => (
          <li key={i} style={pairPromptItemStyle}>{p}</li>
        ))}
      </ol>
    </div>
  )
}

function ClosingCard() {
  return (
    <div style={closingCardStyle}>
      <div style={closingLabelStyle}>That&rsquo;s the move.</div>
      <p style={closingTextStyle}>
        You now know what the other side actually believes — because you had to write it, and someone who holds that view checked your work. That&rsquo;s the difference between debate and noise.
      </p>
    </div>
  )
}

// ---------- Teacher view ----------

function TeacherView({
  data, activityStep, peers, sidePicks, steelmanSubmittedCount, classSize,
  onSetStep, expandedStudent, onExpand,
}: {
  data: U1L5ActivityData
  activityStep: ActivityStep
  peers: RawPeerSubmission[]
  sidePicks: { side: U1L5Side; count: number }[]
  steelmanSubmittedCount: number
  classSize: number
  onSetStep: (step: ActivityStep) => void
  expandedStudent: string | null
  onExpand: (id: string | null) => void
}) {
  const currentStepIndex = STEP_ORDER.indexOf(activityStep)
  const canPrev = currentStepIndex > 0
  const canNext = currentStepIndex < STEP_ORDER.length - 1
  const pickedCount = sidePicks[0].count + sidePicks[1].count

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
            style={{
              ...stepNavBtnStyle,
              opacity: canPrev ? 1 : 0.4,
              cursor: canPrev ? 'pointer' : 'not-allowed',
            }}
          >
            ← Prev
          </button>
          <button
            onClick={() => canNext && onSetStep(STEP_ORDER[currentStepIndex + 1])}
            disabled={!canNext}
            style={{
              ...stepNavBtnStyle,
              opacity: canNext ? 1 : 0.4,
              cursor: canNext ? 'pointer' : 'not-allowed',
            }}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Live counters */}
      <div style={teacherSectionStyle}>
        <div style={teacherSectionLabelStyle}>Class state</div>
        <div style={statsRowStyle}>
          <div style={statBlockStyle}>
            <div style={teacherStatLabelStyle}>Federal</div>
            <div style={teacherStatNumStyle}>{sidePicks[0].count}</div>
          </div>
          <div style={statBlockStyle}>
            <div style={teacherStatLabelStyle}>State</div>
            <div style={teacherStatNumStyle}>{sidePicks[1].count}</div>
          </div>
          <div style={statBlockStyle}>
            <div style={teacherStatLabelStyle}>Picked</div>
            <div style={teacherStatNumStyle}>{pickedCount} / {classSize || '?'}</div>
          </div>
          <div style={statBlockStyle}>
            <div style={teacherStatLabelStyle}>Steelmans submitted</div>
            <div style={teacherStatNumStyle}>{steelmanSubmittedCount} / {classSize || '?'}</div>
          </div>
        </div>
      </div>

      {/* Student list */}
      <div style={teacherSectionStyle}>
        <div style={teacherSectionLabelStyle}>Student submissions</div>
        {peers.length === 0 ? (
          <p style={{ color: 'var(--text-faint)', fontSize: '0.9rem' }}>No one&rsquo;s picked yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {peers.map(peer => {
              const sub = peer.submission
              const isExpanded = expandedStudent === peer.student_id
              const sideLabel = sub.side ? sideDisplayName(sub.side) : '—'
              const opposingLabel = sub.side ? sideDisplayName(oppositeSide(sub.side)) : '—'
              const steelmanStatus = sub.steelman
                ? <span style={{ color: '#2f5d62', fontWeight: 600 }}>✓ Steelman submitted</span>
                : sub.side
                  ? <span style={{ color: 'var(--text-faint)' }}>Picked, no steelman yet</span>
                  : <span style={{ color: 'var(--text-faint)' }}>—</span>
              return (
                <div key={peer.student_id} style={teacherRowStyle}>
                  <button
                    onClick={() => onExpand(isExpanded ? null : peer.student_id)}
                    style={teacherRowHeadStyle}
                  >
                    <span style={{ fontWeight: 600 }}>{peer.display_name ?? '(unnamed)'}</span>
                    <span style={teacherRowMetaStyle}>
                      <span style={sideTagStyle(sub.side)}>{sideLabel}</span>
                      {steelmanStatus}
                      <span style={{ color: 'var(--text-faint)' }}>{isExpanded ? '▴' : '▾'}</span>
                    </span>
                  </button>
                  {isExpanded && (
                    <div style={teacherRowBodyStyle}>
                      {!sub.side ? (
                        <p style={{ color: 'var(--text-faint)', fontSize: '0.85rem', margin: 0 }}>
                          Hasn&rsquo;t picked a side yet.
                        </p>
                      ) : !sub.steelman ? (
                        <p style={{ color: 'var(--text-faint)', fontSize: '0.85rem', margin: 0 }}>
                          Picked <strong>{sideLabel}</strong>. Writing a steelman for {opposingLabel}.
                        </p>
                      ) : (
                        <>
                          <div style={teacherSteelmanMetaStyle}>
                            Picked <strong>{sideLabel}</strong> · Writing for <strong>{opposingLabel}</strong>
                          </div>
                          <div style={teacherSteelmanTextStyle}>{sub.steelman.text}</div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Cases reference */}
      <div style={teacherSectionStyle}>
        <div style={teacherSectionLabelStyle}>Cases — for reference</div>
        {data.cases.map(c => (
          <div key={c.side} style={teacherCaseBlockStyle}>
            <div style={teacherCaseHeadStyle}>{c.label}</div>
            {c.body.split(/\n\n+/).map((p, i) => (
              <p key={i} style={teacherCaseParaStyle}>{p.trim()}</p>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function sideTagStyle(side: U1L5Side | undefined): React.CSSProperties {
  if (!side) return { fontSize: '0.78rem', color: 'var(--text-faint)' }
  return {
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    background: 'rgba(41, 128, 185, 0.1)',
    color: '#2980b9',
  }
}

// ---------- Broadcast fallback ----------

function BroadcastView({
  data, activityStep, sidePicks, submittedCount,
}: {
  data: U1L5ActivityData
  activityStep: ActivityStep
  sidePicks: { side: U1L5Side; count: number }[]
  submittedCount: number
}) {
  return (
    <div style={containerStyle}>
      <div>
        Phase: {STEP_LABELS[activityStep]} · Federal: {sidePicks[0]?.count ?? 0} · State: {sidePicks[1]?.count ?? 0} · Submitted: {submittedCount}
      </div>
      {data.cases.map(c => (
        <div key={c.side}>
          <strong>{c.label}</strong>
        </div>
      ))}
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

const pollPromptStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.15rem',
  color: 'var(--text)',
  marginBottom: '1rem',
  lineHeight: 1.3,
}

const pollOptionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
}

const pollOptionBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '1.1rem 1.4rem',
  background: 'var(--bg2)',
  border: '2px solid var(--border)',
  borderRadius: '10px',
  textAlign: 'left',
  font: 'inherit',
  transition: 'all 0.15s ease',
}

const pollOptionLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.1rem',
  color: 'var(--text)',
}

const pickedBannerStyle: React.CSSProperties = {
  background: 'rgba(200, 169, 110, 0.08)',
  border: '1px solid var(--gold)',
  borderRadius: '8px',
  padding: '0.95rem 1.2rem',
  marginBottom: '1.5rem',
  fontSize: '0.95rem',
  color: 'var(--text)',
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

const caseCardStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '1.5rem 1.75rem',
  marginBottom: '1.5rem',
}

const caseHeadStyle: React.CSSProperties = {
  marginBottom: '1rem',
  paddingBottom: '0.85rem',
  borderBottom: '1px solid var(--border)',
}

const caseFlagStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '0.68rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#2980b9',
  background: 'rgba(41, 128, 185, 0.08)',
  padding: '0.25rem 0.6rem',
  borderRadius: '4px',
  marginBottom: '0.7rem',
}

const caseTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.3rem',
  color: 'var(--text)',
  margin: 0,
  lineHeight: 1.25,
}

const caseParaStyle: React.CSSProperties = {
  fontSize: '0.94rem',
  lineHeight: 1.7,
  color: 'var(--text)',
  margin: '0 0 0.85rem',
}

const writeBoxStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '1.5rem 1.75rem',
  marginBottom: '1.25rem',
}

const writeBoxLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.1rem',
  color: 'var(--text)',
  marginBottom: '0.4rem',
}

const writeBoxHelperStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  color: 'var(--text-dim)',
  lineHeight: 1.6,
  margin: '0 0 1rem',
}

const writeTextareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.85rem 1rem',
  fontFamily: 'inherit',
  fontSize: '0.95rem',
  lineHeight: 1.65,
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  resize: 'vertical',
  minHeight: '16rem',
}

const submitFooterStyle: React.CSSProperties = {
  marginTop: '1.5rem',
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
  marginTop: '1.5rem',
  padding: '1rem 1.25rem',
  background: 'rgba(47, 93, 98, 0.08)',
  border: '1px solid #2f5d62',
  borderRadius: '8px',
  fontSize: '0.92rem',
  color: 'var(--text)',
  lineHeight: 1.55,
}

const pairBoxStyle: React.CSSProperties = {
  marginTop: '1.5rem',
  padding: '1.5rem 1.75rem',
  background: 'rgba(200, 169, 110, 0.06)',
  border: '1px solid var(--gold)',
  borderRadius: '10px',
}

const pairBoxLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.15rem',
  color: 'var(--text)',
  marginBottom: '0.55rem',
}

const pairBoxHelperStyle: React.CSSProperties = {
  fontSize: '0.92rem',
  color: 'var(--text-dim)',
  lineHeight: 1.65,
  margin: '0 0 1.1rem',
}

const pairPromptsLabelStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  marginBottom: '0.5rem',
}

const pairPromptsListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: '1.2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.55rem',
}

const pairPromptItemStyle: React.CSSProperties = {
  fontSize: '0.93rem',
  color: 'var(--text)',
  lineHeight: 1.55,
}

const closingCardStyle: React.CSSProperties = {
  marginTop: '1.5rem',
  padding: '1.5rem 1.75rem',
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderLeft: '3px solid var(--gold)',
  borderRadius: '0 10px 10px 0',
}

const closingLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.2rem',
  color: 'var(--text)',
  marginBottom: '0.55rem',
}

const closingTextStyle: React.CSSProperties = {
  fontSize: '0.95rem',
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

const teacherSteelmanMetaStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: 'var(--text-dim)',
  marginBottom: '0.55rem',
  paddingBottom: '0.45rem',
  borderBottom: '1px dashed var(--border)',
}

const teacherSteelmanTextStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: 'var(--text)',
  lineHeight: 1.65,
  whiteSpace: 'pre-wrap',
}

const teacherCaseBlockStyle: React.CSSProperties = {
  padding: '1rem 1.2rem',
  background: 'var(--bg2)',
  borderLeft: '3px solid var(--gold)',
  borderRadius: '0 6px 6px 0',
  marginBottom: '0.85rem',
}

const teacherCaseHeadStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1rem',
  color: 'var(--text)',
  marginBottom: '0.65rem',
  paddingBottom: '0.4rem',
  borderBottom: '1px solid var(--border)',
}

const teacherCaseParaStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  lineHeight: 1.65,
  color: 'var(--text-dim)',
  margin: '0 0 0.65rem',
}