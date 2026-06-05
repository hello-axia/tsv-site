'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { U1L4ActivityData, U1L4Argument, U1L4AnswerKeyEntry } from '@/content/lessons/u1-l4.meta'

type ActivityStep = 'pick_side' | 'audit' | 'share_out' | 'reveal_key'
type Side = 'A' | 'B'

type AuditData = {
  strengths: string[]
  weaknesses: string[]
  submittedAt: string
}

type U1L4Submission = {
  side?: Side
  sidePickedAt?: string
  audit?: AuditData
}

type RawPeerSubmission = {
  student_id: string
  display_name: string | null
  submission: U1L4Submission
}

type Mode = 'student' | 'teacher' | 'broadcast'

type Props = {
  assignmentId: string
  lessonId: string
  profileId: string
  data: U1L4ActivityData
  mode?: Mode

  // Broadcast mode only.
  broadcastActivityStep?: ActivityStep
  broadcastSidePicks?: { side: Side; count: number }[]
  broadcastSubmittedCount?: number
}

const NUM_ENTRIES = 3

const emptyAudit = (): AuditData => ({
  strengths: ['', '', ''],
  weaknesses: ['', '', ''],
  submittedAt: '',
})

const STEP_ORDER: ActivityStep[] = ['pick_side', 'audit', 'share_out', 'reveal_key']
const STEP_LABELS: Record<ActivityStep, string> = {
  pick_side: 'Pick side',
  audit: 'Audit',
  share_out: 'Share-out',
  reveal_key: 'Reveal key',
}

export default function U1L4AuditActivity({
  assignmentId,
  lessonId,
  profileId,
  data,
  mode = 'student',
  broadcastActivityStep,
  broadcastSidePicks,
  broadcastSubmittedCount,
}: Props) {
  // activity_state: { activityStep: ActivityStep }
  const [activityStep, setActivityStep] = useState<ActivityStep>(
    broadcastActivityStep ?? 'pick_side'
  )

  const [mySubmission, setMySubmission] = useState<U1L4Submission>({})
  const [auditDraft, setAuditDraft] = useState<AuditData>(emptyAudit())
  const [loadedFromDb, setLoadedFromDb] = useState(false)
  const [submittingSide, setSubmittingSide] = useState(false)
  const [submittingAudit, setSubmittingAudit] = useState(false)

  // Teacher mode
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
        const sub = row.data as U1L4Submission
        setMySubmission(sub)
        if (sub.audit) {
          setAuditDraft({
            strengths: padToN(sub.audit.strengths ?? []),
            weaknesses: padToN(sub.audit.weaknesses ?? []),
            submittedAt: sub.audit.submittedAt ?? '',
          })
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
        const d = row.data as U1L4Submission
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
  async function pickSide(side: Side) {
    if (mode !== 'student' || mySubmission.side || submittingSide) return
    setSubmittingSide(true)
    const supabase = createClient()
    const now = new Date().toISOString()
    const nextSub: U1L4Submission = { side, sidePickedAt: now }
    const { error } = await supabase
      .from('activity_submissions')
      .upsert({
        student_id: profileId,
        assignment_id: assignmentId,
        lesson_id: lessonId,
        activity_type: 'u1_l4_audit',
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

  function updateAuditField(box: 'strengths' | 'weaknesses', index: number, value: string) {
    if (mySubmission.audit) return
    setAuditDraft(prev => {
      const nextBox = [...prev[box]]
      nextBox[index] = value
      return { ...prev, [box]: nextBox }
    })
  }

  async function submitAudit() {
    if (mode !== 'student') return
    if (!mySubmission.side || mySubmission.audit || submittingAudit) return
    if (activityStep !== 'audit' && activityStep !== 'share_out') return

    const trimmedStrengths = auditDraft.strengths.map(s => s.trim())
    const trimmedWeaknesses = auditDraft.weaknesses.map(s => s.trim())
    const hasAnyContent =
      trimmedStrengths.some(s => s.length > 0) ||
      trimmedWeaknesses.some(s => s.length > 0)
    if (!hasAnyContent) return

    setSubmittingAudit(true)
    const supabase = createClient()
    const now = new Date().toISOString()
    const audit: AuditData = {
      strengths: trimmedStrengths,
      weaknesses: trimmedWeaknesses,
      submittedAt: now,
    }
    const nextSub: U1L4Submission = { ...mySubmission, audit }
    const { error } = await supabase
      .from('activity_submissions')
      .upsert({
        student_id: profileId,
        assignment_id: assignmentId,
        lesson_id: lessonId,
        activity_type: 'u1_l4_audit',
        data: nextSub,
        submitted_at: now,
      }, { onConflict: 'student_id,assignment_id' })
    if (error) {
      alert(`Could not submit your audit. ${error.message}`)
      setSubmittingAudit(false)
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
    setSubmittingAudit(false)
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
        auditDraft={auditDraft}
        loaded={loadedFromDb}
        submittingSide={submittingSide}
        submittingAudit={submittingAudit}
        onPickSide={pickSide}
        onUpdateAudit={updateAuditField}
        onSubmitAudit={submitAudit}
      />
    )
  }

  if (mode === 'teacher') {
    const sidePicks = countSidePicks(peers)
    const auditSubmittedCount = peers.filter(p => p.submission.audit).length
    return (
      <TeacherView
        data={data}
        activityStep={activityStep}
        peers={peers}
        sidePicks={sidePicks}
        auditSubmittedCount={auditSubmittedCount}
        classSize={classSize}
        onSetStep={writeActivityStep}
        expandedStudent={expandedStudent}
        onExpand={setExpandedStudent}
      />
    )
  }

  // Broadcast fallback — broadcast-shell renders the real one.
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

function padToN(arr: string[]): string[] {
  const out = [...arr]
  while (out.length < NUM_ENTRIES) out.push('')
  return out.slice(0, NUM_ENTRIES)
}

function countSidePicks(peers: RawPeerSubmission[]): { side: Side; count: number }[] {
  const a = peers.filter(p => p.submission.side === 'A').length
  const b = peers.filter(p => p.submission.side === 'B').length
  return [
    { side: 'A', count: a },
    { side: 'B', count: b },
  ]
}

// ---------- Student view ----------

function StudentView({
  data, activityStep, mySubmission, auditDraft, loaded,
  submittingSide, submittingAudit, onPickSide, onUpdateAudit, onSubmitAudit,
}: {
  data: U1L4ActivityData
  activityStep: ActivityStep
  mySubmission: U1L4Submission
  auditDraft: AuditData
  loaded: boolean
  submittingSide: boolean
  submittingAudit: boolean
  onPickSide: (side: Side) => void
  onUpdateAudit: (box: 'strengths' | 'weaknesses', index: number, value: string) => void
  onSubmitAudit: () => void
}) {
  if (!loaded) {
    return <div style={containerStyle}><p style={{ color: 'var(--text-faint)' }}>Loading…</p></div>
  }

  // Phase 1: haven't picked yet — show both arguments + pick buttons.
  if (!mySubmission.side) {
    return (
      <div style={containerStyle}>
        <div style={instructionStyle}>
          <p style={{ margin: 0 }}>{data.prompt}</p>
        </div>

        {data.arguments.map(arg => (
          <ArgumentCard
            key={arg.side}
            arg={arg}
            picked={false}
            showPickButton
            disabled={submittingSide}
            onPick={() => onPickSide(arg.side)}
          />
        ))}
      </div>
    )
  }

  // Phase 2+: picked a side. Show only their side + audit boxes.
  const mySide = mySubmission.side
  const myArg = data.arguments.find(a => a.side === mySide)!
  const myKey = data.answerKey.find(k => k.side === mySide)!
  const isSubmitted = !!mySubmission.audit
  const submitEnabled =
    !isSubmitted &&
    !submittingAudit &&
    (activityStep === 'audit' || activityStep === 'share_out') &&
    hasAnyContent(auditDraft)
  const inputsLocked = isSubmitted || activityStep === 'reveal_key'

  const waitingMessage =
    activityStep === 'pick_side'
      ? 'You picked your side. The audit boxes open when your teacher starts the audit phase.'
      : activityStep === 'reveal_key' && !isSubmitted
        ? 'The audit is closed. Compare your thinking against the answer key below.'
        : null

  return (
    <div style={containerStyle}>
      <div style={pickedBannerStyle}>
        You picked <strong>Argument {mySide}</strong>. Now audit it — find the weak points you would have caught if you&rsquo;d been reading the other side.
      </div>

      <ArgumentCard arg={myArg} picked />

      {waitingMessage && (
        <div style={waitingNoteStyle}>{waitingMessage}</div>
      )}

      <AuditBox
        label="What does your argument do well?"
        helper="What are the defensible, hard-to-attack claims? (You picked this side for a reason — name what's actually strong.)"
        box="strengths"
        values={isSubmitted ? (mySubmission.audit?.strengths ?? []) : auditDraft.strengths}
        locked={inputsLocked}
        onChange={onUpdateAudit}
      />

      <AuditBox
        label="What does your argument lack or smooth over?"
        helper="Where does the argument substitute emotion for evidence, make unfalsifiable claims, attack people instead of ideas, cherry-pick examples, or ignore obvious counterarguments?"
        box="weaknesses"
        values={isSubmitted ? (mySubmission.audit?.weaknesses ?? []) : auditDraft.weaknesses}
        locked={inputsLocked}
        onChange={onUpdateAudit}
      />

      {!isSubmitted && activityStep !== 'reveal_key' && (
        <div style={submitFooterStyle}>
          <button
            onClick={onSubmitAudit}
            disabled={!submitEnabled}
            style={{
              ...submitBtnStyle,
              opacity: !submitEnabled ? 0.5 : 1,
              cursor: !submitEnabled ? 'default' : 'pointer',
            }}
          >
            {submittingAudit ? 'Submitting…' : 'Submit our audit'}
          </button>
          <p style={submitHintStyle}>
            {activityStep === 'pick_side'
              ? 'Wait for your teacher to start the audit phase.'
              : "You can't edit after you submit. Make sure your group is ready."}
          </p>
        </div>
      )}

      {isSubmitted && activityStep !== 'reveal_key' && (
        <div style={submittedFooterStyle}>
          <strong>✓ Submitted.</strong>{' '}
          Wait for your teacher to walk through the answer key.
        </div>
      )}

      {activityStep === 'reveal_key' && (
        <AnswerKeyForSide entry={myKey} />
      )}
    </div>
  )
}

function hasAnyContent(d: AuditData): boolean {
  return d.strengths.some(s => s.trim().length > 0) || d.weaknesses.some(s => s.trim().length > 0)
}

function ArgumentCard({
  arg, picked, showPickButton, disabled, onPick,
}: {
  arg: U1L4Argument
  picked: boolean
  showPickButton?: boolean
  disabled?: boolean
  onPick?: () => void
}) {
  return (
    <div style={argCardStyle}>
      <div style={argHeadStyle}>
        <span style={argSideBadgeStyle}>Argument {arg.side}</span>
        <div style={argLabelStyle}>{arg.label}</div>
      </div>
      <p style={argBodyStyle}>{arg.body}</p>
      {showPickButton && (
        <button
          onClick={onPick}
          disabled={disabled}
          style={{
            ...pickBtnStyle,
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'default' : 'pointer',
          }}
        >
          I agree more with Argument {arg.side}
        </button>
      )}
      {picked && (
        <div style={pickedFlagStyle}>✓ You picked this side</div>
      )}
    </div>
  )
}

function AuditBox({
  label, helper, box, values, locked, onChange,
}: {
  label: string
  helper: string
  box: 'strengths' | 'weaknesses'
  values: string[]
  locked: boolean
  onChange: (box: 'strengths' | 'weaknesses', index: number, value: string) => void
}) {
  const slots = padToN(values)
  return (
    <div style={auditBoxStyle}>
      <div style={auditBoxLabelStyle}>{label}</div>
      <p style={auditBoxHelperStyle}>{helper}</p>
      {slots.map((v, i) => (
        <textarea
          key={i}
          value={v}
          onChange={e => onChange(box, i, e.target.value)}
          disabled={locked}
          rows={2}
          placeholder={`${box === 'strengths' ? 'Strength' : 'Weakness'} #${i + 1}…`}
          style={{
            ...auditTextareaStyle,
            background: locked ? 'var(--bg2)' : 'var(--bg)',
            cursor: locked ? 'default' : 'text',
          }}
        />
      ))}
    </div>
  )
}

function AnswerKeyForSide({ entry }: { entry: U1L4AnswerKeyEntry }) {
  return (
    <div style={answerKeySectionStyle}>
      <div style={answerKeyHeaderStyle}>
        Answer key — Argument {entry.side}
      </div>

      <div style={answerKeyGroupStyle}>
        <div style={answerKeyGroupLabelStyle}>What it does well</div>
        {entry.strengths.map((s, i) => (
          <div key={i} style={answerKeyEntryStyle}>
            <div style={answerKeyEntryTitleStyle}>{s.title}</div>
            <div style={answerKeyEntryBodyStyle}>{s.body}</div>
          </div>
        ))}
      </div>

      <div style={answerKeyGroupStyle}>
        <div style={answerKeyGroupLabelStyle}>What it lacks or smooths over</div>
        {entry.weaknesses.map((w, i) => (
          <div key={i} style={answerKeyEntryStyle}>
            <div style={answerKeyEntryTitleStyle}>{w.title}</div>
            <div style={answerKeyEntryBodyStyle}>{w.body}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- Teacher view ----------

function TeacherView({
  data, activityStep, peers, sidePicks, auditSubmittedCount, classSize,
  onSetStep, expandedStudent, onExpand,
}: {
  data: U1L4ActivityData
  activityStep: ActivityStep
  peers: RawPeerSubmission[]
  sidePicks: { side: Side; count: number }[]
  auditSubmittedCount: number
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
            <div style={teacherStatLabelStyle}>Side A</div>
            <div style={teacherStatNumStyle}>{sidePicks[0].count}</div>
          </div>
          <div style={statBlockStyle}>
            <div style={teacherStatLabelStyle}>Side B</div>
            <div style={teacherStatNumStyle}>{sidePicks[1].count}</div>
          </div>
          <div style={statBlockStyle}>
            <div style={teacherStatLabelStyle}>Picked</div>
            <div style={teacherStatNumStyle}>{pickedCount} / {classSize || '?'}</div>
          </div>
          <div style={statBlockStyle}>
            <div style={teacherStatLabelStyle}>Audits submitted</div>
            <div style={teacherStatNumStyle}>{auditSubmittedCount} / {classSize || '?'}</div>
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
              const sideLabel = sub.side ? `Side ${sub.side}` : '—'
              const auditStatus = sub.audit
                ? <span style={{ color: '#2f5d62', fontWeight: 600 }}>✓ Audit submitted</span>
                : sub.side
                  ? <span style={{ color: 'var(--text-faint)' }}>Picked, no audit yet</span>
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
                      {auditStatus}
                      <span style={{ color: 'var(--text-faint)' }}>{isExpanded ? '▴' : '▾'}</span>
                    </span>
                  </button>
                  {isExpanded && (
                    <div style={teacherRowBodyStyle}>
                      {!sub.audit ? (
                        <p style={{ color: 'var(--text-faint)', fontSize: '0.85rem', margin: 0 }}>
                          No audit submitted yet.
                        </p>
                      ) : (
                        <>
                          <div style={teacherAuditBlockStyle}>
                            <div style={teacherAuditLabelStyle}>What it does well</div>
                            {sub.audit.strengths.filter(s => s.trim().length > 0).length === 0 ? (
                              <p style={teacherEmptyEntryStyle}>(empty)</p>
                            ) : (
                              sub.audit.strengths
                                .filter(s => s.trim().length > 0)
                                .map((s, i) => <p key={i} style={teacherEntryStyle}>• {s}</p>)
                            )}
                          </div>
                          <div style={teacherAuditBlockStyle}>
                            <div style={teacherAuditLabelStyle}>What it lacks or smooths over</div>
                            {sub.audit.weaknesses.filter(s => s.trim().length > 0).length === 0 ? (
                              <p style={teacherEmptyEntryStyle}>(empty)</p>
                            ) : (
                              sub.audit.weaknesses
                                .filter(s => s.trim().length > 0)
                                .map((w, i) => <p key={i} style={teacherEntryStyle}>• {w}</p>)
                            )}
                          </div>
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

      {/* Always-on answer key reference */}
      <div style={teacherSectionStyle}>
        <div style={teacherSectionLabelStyle}>Answer key — for reference</div>
        {data.answerKey.map(entry => (
          <div key={entry.side} style={teacherAnswerKeyBlockStyle}>
            <div style={teacherAnswerKeyHeadStyle}>Argument {entry.side}</div>
            <div style={teacherAnswerKeyGroupLabelStyle}>What it does well</div>
            {entry.strengths.map((s, i) => (
              <div key={`s-${i}`} style={teacherAnswerKeyEntryStyle}>
                <strong>{s.title}</strong> {s.body}
              </div>
            ))}
            <div style={teacherAnswerKeyGroupLabelStyle}>What it lacks or smooths over</div>
            {entry.weaknesses.map((w, i) => (
              <div key={`w-${i}`} style={teacherAnswerKeyEntryStyle}>
                <strong>{w.title}</strong> {w.body}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function sideTagStyle(side: Side | undefined): React.CSSProperties {
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
// broadcast-shell renders the real broadcast view; this is a fallback only.

function BroadcastView({
  data, activityStep, sidePicks, submittedCount,
}: {
  data: U1L4ActivityData
  activityStep: ActivityStep
  sidePicks: { side: Side; count: number }[]
  submittedCount: number
}) {
  return (
    <div style={containerStyle}>
      <div>
        Phase: {STEP_LABELS[activityStep]} · A: {sidePicks[0]?.count ?? 0} · B: {sidePicks[1]?.count ?? 0} · Submitted: {submittedCount}
      </div>
      {data.arguments.map(arg => (
        <div key={arg.side}>
          <strong>Argument {arg.side}.</strong> {arg.label}
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
  lineHeight: 1.6,
}

const pickedBannerStyle: React.CSSProperties = {
  background: 'rgba(200, 169, 110, 0.08)',
  border: '1px solid var(--gold)',
  borderRadius: '8px',
  padding: '0.85rem 1.1rem',
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

const argCardStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '1.25rem 1.5rem',
  marginBottom: '1.25rem',
}

const argHeadStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '0.85rem',
  marginBottom: '1rem',
  paddingBottom: '0.85rem',
  borderBottom: '1px solid var(--border)',
  flexWrap: 'wrap',
}

const argSideBadgeStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#2980b9',
  background: 'rgba(41, 128, 185, 0.08)',
  padding: '0.25rem 0.55rem',
  borderRadius: '4px',
  whiteSpace: 'nowrap',
}

const argLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.15rem',
  color: 'var(--text)',
  lineHeight: 1.3,
}

const argBodyStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  lineHeight: 1.65,
  color: 'var(--text)',
  margin: '0 0 1.1rem',
}

const pickBtnStyle: React.CSSProperties = {
  padding: '0.75rem 1.4rem',
  fontSize: '0.9rem',
  fontWeight: 600,
  letterSpacing: '0.03em',
  color: '#fff',
  background: 'var(--gold)',
  border: 'none',
  borderRadius: '6px',
  font: 'inherit',
}

const pickedFlagStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 600,
  letterSpacing: '0.05em',
  color: 'var(--gold)',
  marginTop: '0.2rem',
}

const auditBoxStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '1.25rem 1.5rem',
  marginBottom: '1.25rem',
}

const auditBoxLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.05rem',
  color: 'var(--text)',
  marginBottom: '0.35rem',
}

const auditBoxHelperStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: 'var(--text-dim)',
  lineHeight: 1.55,
  margin: '0 0 0.85rem',
}

const auditTextareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.85rem',
  fontFamily: 'inherit',
  fontSize: '0.9rem',
  lineHeight: 1.5,
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  resize: 'vertical',
  minHeight: '3rem',
  marginBottom: '0.5rem',
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

// --- Answer key on student device ---

const answerKeySectionStyle: React.CSSProperties = {
  marginTop: '1.75rem',
  padding: '1.5rem',
  background: 'rgba(200, 169, 110, 0.06)',
  border: '1px solid var(--gold)',
  borderRadius: '10px',
}

const answerKeyHeaderStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.1rem',
  color: 'var(--text)',
  marginBottom: '1rem',
  paddingBottom: '0.6rem',
  borderBottom: '1px solid var(--gold)',
}

const answerKeyGroupStyle: React.CSSProperties = {
  marginBottom: '1.25rem',
}

const answerKeyGroupLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  marginBottom: '0.6rem',
}

const answerKeyEntryStyle: React.CSSProperties = {
  marginBottom: '0.85rem',
}

const answerKeyEntryTitleStyle: React.CSSProperties = {
  fontSize: '0.92rem',
  fontWeight: 600,
  color: 'var(--text)',
  marginBottom: '0.2rem',
}

const answerKeyEntryBodyStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  color: 'var(--text-dim)',
  lineHeight: 1.6,
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
  padding: '0.75rem 1rem 1rem',
  borderTop: '1px solid var(--border)',
  background: 'var(--bg)',
}

const teacherAuditBlockStyle: React.CSSProperties = {
  marginBottom: '0.85rem',
}

const teacherAuditLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#2980b9',
  marginBottom: '0.35rem',
}

const teacherEntryStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  lineHeight: 1.5,
  color: 'var(--text)',
  margin: '0 0 0.25rem',
}

const teacherEmptyEntryStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  color: 'var(--text-faint)',
  fontStyle: 'italic',
  margin: 0,
}

const teacherAnswerKeyBlockStyle: React.CSSProperties = {
  padding: '1rem 1.2rem',
  background: 'var(--bg2)',
  borderLeft: '3px solid var(--gold)',
  borderRadius: '0 6px 6px 0',
  marginBottom: '0.85rem',
}

const teacherAnswerKeyHeadStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1rem',
  color: 'var(--text)',
  marginBottom: '0.65rem',
  paddingBottom: '0.4rem',
  borderBottom: '1px solid var(--border)',
}

const teacherAnswerKeyGroupLabelStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  margin: '0.6rem 0 0.4rem',
}

const teacherAnswerKeyEntryStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  lineHeight: 1.55,
  color: 'var(--text-dim)',
  marginBottom: '0.45rem',
}