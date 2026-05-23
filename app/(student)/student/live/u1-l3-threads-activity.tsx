'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { U1L3ActivityData, U1L3Claim } from '@/content/lessons/u1-l3.meta'

type ClaimAnswer = { empirical: string; normative: string }
type U1L3Submission = {
  submitted: boolean
  claim1: ClaimAnswer
  claim2: ClaimAnswer
  claim3: ClaimAnswer
  claim4: ClaimAnswer
  claim5: ClaimAnswer
}

type RawPeerSubmission = {
  student_id: string
  display_name: string | null
  submission: U1L3Submission
}

type Mode = 'student' | 'teacher' | 'broadcast'

type Props = {
    assignmentId: string
    lessonId: string
    profileId: string
    data: U1L3ActivityData
    mode?: Mode
  
    // Broadcast mode only.
    broadcastShownClaims?: number[]
    broadcastRevealedClaims?: number[]
    broadcastSubmittedCount?: number
  }

type ClaimKey = 'claim1' | 'claim2' | 'claim3' | 'claim4' | 'claim5'

const emptyAnswer: ClaimAnswer = { empirical: '', normative: '' }
const emptySubmission: U1L3Submission = {
  submitted: false,
  claim1: { ...emptyAnswer },
  claim2: { ...emptyAnswer },
  claim3: { ...emptyAnswer },
  claim4: { ...emptyAnswer },
  claim5: { ...emptyAnswer },
}

export default function U1L3ThreadsActivity({
    assignmentId,
    lessonId,
    profileId,
    data,
    mode = 'student',
    broadcastShownClaims,
    broadcastRevealedClaims,
    broadcastSubmittedCount,
  }: Props) {
  // activity_state: { shownClaims: number[], revealedClaims: number[] }
  const [shownClaims, setShownClaims] = useState<number[]>(
    broadcastShownClaims ?? []
  )
  const [revealedClaims, setRevealedClaims] = useState<number[]>(
    broadcastRevealedClaims ?? []
  )

  // Student's own draft + submission status.
  const [myDraft, setMyDraft] = useState<U1L3Submission>(emptySubmission)
  const [loadedFromDb, setLoadedFromDb] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Teacher mode: list of peer submissions for the cockpit.
  const [peers, setPeers] = useState<RawPeerSubmission[]>([])
  const [classSize, setClassSize] = useState<number>(0)
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

  // --- Poll activity_state (student + teacher modes).
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
        const stateObj = (row.activity_state ?? {}) as {
          shownClaims?: number[]
          revealedClaims?: number[]
        }
        setShownClaims(Array.isArray(stateObj.shownClaims) ? stateObj.shownClaims : [])
        setRevealedClaims(Array.isArray(stateObj.revealedClaims) ? stateObj.revealedClaims : [])
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
        const d = row.data as Partial<U1L3Submission>
        setMyDraft({
          submitted: !!d.submitted,
          claim1: d.claim1 ?? { ...emptyAnswer },
          claim2: d.claim2 ?? { ...emptyAnswer },
          claim3: d.claim3 ?? { ...emptyAnswer },
          claim4: d.claim4 ?? { ...emptyAnswer },
          claim5: d.claim5 ?? { ...emptyAnswer },
        })
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
        const d = row.data as Partial<U1L3Submission>
        const profile = row.profiles as unknown as { display_name: string | null } | null
        parsed.push({
          student_id: row.student_id,
          display_name: profile?.display_name ?? null,
          submission: {
            submitted: !!d.submitted,
            claim1: d.claim1 ?? { ...emptyAnswer },
            claim2: d.claim2 ?? { ...emptyAnswer },
            claim3: d.claim3 ?? { ...emptyAnswer },
            claim4: d.claim4 ?? { ...emptyAnswer },
            claim5: d.claim5 ?? { ...emptyAnswer },
          },
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

  // --- Student handlers.
  function updateField(claimKey: ClaimKey, side: 'empirical' | 'normative', value: string) {
    if (myDraft.submitted) return
    setMyDraft(prev => ({
      ...prev,
      [claimKey]: { ...prev[claimKey], [side]: value },
    }))
  }

  async function submitWork() {
    if (mode !== 'student' || submitting || myDraft.submitted) return
    setSubmitting(true)
    const supabase = createClient()
    const nextSub: U1L3Submission = { ...myDraft, submitted: true }
    const { error } = await supabase
      .from('activity_submissions')
      .upsert({
        student_id: profileId,
        assignment_id: assignmentId,
        lesson_id: lessonId,
        activity_type: 'u1_l3_threads',
        data: nextSub,
        submitted_at: new Date().toISOString(),
      }, { onConflict: 'student_id,assignment_id' })
    if (error) {
      alert(`Could not submit. ${error.message}`)
      setSubmitting(false)
      return
    }
    setMyDraft(nextSub)
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

  // --- Teacher handlers: toggle the claim's text visibility and its answer key.
  async function writeActivityState(nextShown: number[], nextRevealed: number[]) {
    const supabase = createClient()
    const { error } = await supabase
      .from('lesson_assignments')
      .update({ activity_state: { shownClaims: nextShown, revealedClaims: nextRevealed } })
      .eq('id', assignmentId)
    if (error) {
      alert(`Could not update reveal state. ${error.message}`)
      return false
    }
    setShownClaims(nextShown)
    setRevealedClaims(nextRevealed)
    return true
  }

  async function toggleClaimShown(claimIndex: number) {
    if (mode !== 'teacher') return
    const isShown = shownClaims.includes(claimIndex)
    const nextShown = isShown
      ? shownClaims.filter(i => i !== claimIndex)
      : [...shownClaims, claimIndex].sort((a, b) => a - b)
    // Hiding a claim also hides its answer key (invariant: revealed ⊆ shown).
    const nextRevealed = isShown
      ? revealedClaims.filter(i => i !== claimIndex)
      : revealedClaims
    await writeActivityState(nextShown, nextRevealed)
  }

  async function toggleClaimRevealed(claimIndex: number) {
    if (mode !== 'teacher') return
    // Can't reveal an answer for a claim whose text isn't shown.
    if (!shownClaims.includes(claimIndex)) return
    const nextRevealed = revealedClaims.includes(claimIndex)
      ? revealedClaims.filter(i => i !== claimIndex)
      : [...revealedClaims, claimIndex].sort((a, b) => a - b)
    await writeActivityState(shownClaims, nextRevealed)
  }

  // --- Render
  if (mode === 'student') {
    return (
      <StudentView
        data={data}
        draft={myDraft}
        loaded={loadedFromDb}
        shownClaims={shownClaims}
        revealedClaims={revealedClaims}
        submitting={submitting}
        onChange={updateField}
        onSubmit={submitWork}
      />
    )
  }

  if (mode === 'teacher') {
    const submittedCount = peers.filter(p => p.submission.submitted).length
    return (
      <TeacherView
        data={data}
        peers={peers}
        submittedCount={submittedCount}
        classSize={classSize}
        shownClaims={shownClaims}
        revealedClaims={revealedClaims}
        onToggleShown={toggleClaimShown}
        onToggleRevealed={toggleClaimRevealed}
        expandedStudent={expandedStudent}
        onExpand={setExpandedStudent}
      />
    )
  }

  // broadcast
  return (
    <BroadcastView
      data={data}
      shownClaims={broadcastShownClaims ?? []}
      revealedClaims={broadcastRevealedClaims ?? []}
      submittedCount={broadcastSubmittedCount ?? 0}
    />
  )
}

// ---------- Student view ----------

function StudentView({
    data, draft, loaded, shownClaims, revealedClaims, submitting, onChange, onSubmit,
  }: {
    data: U1L3ActivityData
    draft: U1L3Submission
    loaded: boolean
    shownClaims: number[]
    revealedClaims: number[]
    submitting: boolean
    onChange: (k: ClaimKey, s: 'empirical' | 'normative', v: string) => void
    onSubmit: () => void
  }) {
    if (!loaded) {
      return <div style={containerStyle}><p style={{ color: 'var(--text-faint)' }}>Loading…</p></div>
    }
  
    const hasAnyContent =
      Object.entries(draft)
        .filter(([k]) => k.startsWith('claim'))
        .some(([, v]) => {
          const ans = v as ClaimAnswer
          return (ans.empirical || '').trim().length > 0 ||
                 (ans.normative || '').trim().length > 0
        })
  
    const allShown = data.claims.every(c => shownClaims.includes(c.index))
    const canSubmit = allShown && hasAnyContent && !draft.submitted
  
    return (
      <div style={containerStyle}>
        <div style={instructionStyle}>
          <p style={{ margin: 0 }}>
            Work with your partner. Your teacher will reveal one claim at a time. For each claim,
            name the two threads inside it. Write the kind of <strong>question or evidence</strong>
            each side is looking for &mdash; not your opinion on the claim itself.
          </p>
        </div>
  
        {data.claims.map(claim => (
          <ClaimCard
            key={claim.key}
            claim={claim}
            answer={draft[claim.key as ClaimKey]}
            locked={draft.submitted}
            shown={shownClaims.includes(claim.index)}
            revealed={revealedClaims.includes(claim.index)}
            onChange={(side, value) => onChange(claim.key as ClaimKey, side, value)}
          />
        ))}
  
        {!draft.submitted ? (
          <div style={submitFooterStyle}>
            <button
              onClick={onSubmit}
              disabled={!canSubmit || submitting}
              style={{
                ...submitBtnStyle,
                opacity: !canSubmit || submitting ? 0.5 : 1,
                cursor: !canSubmit || submitting ? 'default' : 'pointer',
              }}
            >
              {submitting ? 'Submitting…' : 'Submit our answers'}
            </button>
            <p style={submitHintStyle}>
              {allShown
                ? "You can't edit after you submit. Make sure your partner is ready."
                : `Waiting for your teacher to reveal all 5 claims. (${shownClaims.length}/5 shown.)`}
            </p>
          </div>
        ) : (
          <div style={submittedFooterStyle}>
            <strong>✓ Submitted.</strong>{' '}
            {revealedClaims.length > 0
              ? 'Your teacher is revealing the answer key claim by claim.'
              : 'Waiting for your teacher to reveal the answer key.'}
          </div>
        )}
      </div>
    )
  }

  function ClaimCard({
    claim, answer, locked, shown, revealed, onChange,
  }: {
    claim: U1L3Claim
    answer: ClaimAnswer
    locked: boolean
    shown: boolean
    revealed: boolean
    onChange: (side: 'empirical' | 'normative', value: string) => void
  }) {
    // Hidden state: numbered placeholder card with no claim text and no inputs.
    if (!shown) {
      return (
        <div style={{ ...claimCardStyle, opacity: 0.55 }}>
          <div style={claimHeadStyle}>
            <span style={claimNumStyle}>Claim {claim.index}</span>
            <div style={{ ...claimTextStyle, fontStyle: 'italic', color: 'var(--text-faint)' }}>
              Hidden — waiting for your teacher to reveal this claim.
            </div>
          </div>
        </div>
      )
    }
  
    return (
      <div style={claimCardStyle}>
        <div style={claimHeadStyle}>
          <span style={claimNumStyle}>Claim {claim.index}</span>
          <div style={claimTextStyle}>{claim.claim}</div>
        </div>
  
        {/* Empirical */}
        <div style={fieldGroupStyle}>
          <label style={fieldLabelStyle}>Empirical thread — what evidence is this side looking for?</label>
          <textarea
            value={answer.empirical}
            onChange={e => onChange('empirical', e.target.value)}
            disabled={locked}
            rows={2}
            placeholder="What evidence or studies would settle this part of the claim?"
            style={{
              ...textareaStyle,
              background: locked ? 'var(--bg2)' : 'var(--bg)',
              cursor: locked ? 'default' : 'text',
            }}
          />
          {revealed && (
            <div style={answerKeyBoxStyle}>
              <div style={answerKeyLabelStyle}>Answer key</div>
              <div style={answerKeyTextStyle}>{claim.answerKey.empirical}</div>
            </div>
          )}
        </div>
  
        {/* Normative */}
        <div style={fieldGroupStyle}>
          <label style={fieldLabelStyle}>Normative thread — what values is this side arguing about?</label>
          <textarea
            value={answer.normative}
            onChange={e => onChange('normative', e.target.value)}
            disabled={locked}
            rows={2}
            placeholder="What values or principles is this side of the claim invoking?"
            style={{
              ...textareaStyle,
              background: locked ? 'var(--bg2)' : 'var(--bg)',
              cursor: locked ? 'default' : 'text',
            }}
          />
          {revealed && (
            <div style={answerKeyBoxStyle}>
              <div style={answerKeyLabelStyle}>Answer key</div>
              <div style={answerKeyTextStyle}>{claim.answerKey.normative}</div>
            </div>
          )}
        </div>
      </div>
    )
  }

// ---------- Teacher view ----------

function TeacherView({
    data, peers, submittedCount, classSize,
    shownClaims, revealedClaims,
    onToggleShown, onToggleRevealed,
    expandedStudent, onExpand,
  }: {
    data: U1L3ActivityData
    peers: RawPeerSubmission[]
    submittedCount: number
    classSize: number
    shownClaims: number[]
    revealedClaims: number[]
    onToggleShown: (claimIndex: number) => void
    onToggleRevealed: (claimIndex: number) => void
    expandedStudent: string | null
    onExpand: (id: string | null) => void
  }) {
    return (
      <div style={containerStyle}>
        <div style={teacherHeadStyle}>
          <div>
            <div style={teacherStatLabelStyle}>Submission progress</div>
            <div style={teacherStatNumStyle}>
              {submittedCount} of {classSize || '?'} submitted
            </div>
          </div>
        </div>
  
        {/* Two-stage reveal controls */}
        <div style={teacherSectionStyle}>
          <div style={teacherSectionLabelStyle}>Reveal controls</div>
          <div style={teacherRevealGridStyle}>
            <div style={teacherRevealColStyle}>
              <div style={teacherRevealColLabelStyle}>Show claim text</div>
              <div style={teacherClaimPillRowVerticalStyle}>
                {data.claims.map(c => {
                  const isShown = shownClaims.includes(c.index)
                  return (
                    <button
                      key={c.key}
                      onClick={() => onToggleShown(c.index)}
                      style={{
                        ...teacherClaimPillStyle,
                        background: isShown ? '#2980b9' : 'var(--bg2)',
                        color: isShown ? '#fff' : 'var(--text-dim)',
                        border: `1px solid ${isShown ? '#2980b9' : 'var(--border)'}`,
                      }}
                      title={isShown ? `Hide Claim ${c.index}` : `Show Claim ${c.index}`}
                    >
                      {isShown ? '✓ ' : ''}Claim {c.index}
                    </button>
                  )
                })}
              </div>
            </div>
  
            <div style={teacherRevealColStyle}>
              <div style={teacherRevealColLabelStyle}>Reveal answer key</div>
              <div style={teacherClaimPillRowVerticalStyle}>
                {data.claims.map(c => {
                  const isShown = shownClaims.includes(c.index)
                  const isRevealed = revealedClaims.includes(c.index)
                  const disabled = !isShown
                  return (
                    <button
                      key={c.key}
                      onClick={() => onToggleRevealed(c.index)}
                      disabled={disabled}
                      style={{
                        ...teacherClaimPillStyle,
                        background: isRevealed ? 'var(--gold)' : 'var(--bg2)',
                        color: isRevealed ? '#fff' : disabled ? 'var(--text-faint)' : 'var(--text-dim)',
                        border: `1px solid ${isRevealed ? 'var(--gold)' : 'var(--border)'}`,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.5 : 1,
                      }}
                      title={
                        disabled
                          ? `Show Claim ${c.index} first`
                          : isRevealed
                            ? `Hide Claim ${c.index}'s answer key`
                            : `Reveal Claim ${c.index}'s answer key`
                      }
                    >
                      {isRevealed ? '✓ ' : ''}Claim {c.index}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <p style={teacherRevealHintStyle}>
            Show each claim before revealing its answer key. Click a pill to toggle.
          </p>
        </div>
  
        {/* Student list */}
        <div style={teacherSectionStyle}>
          <div style={teacherSectionLabelStyle}>Pair submissions</div>
          {peers.length === 0 ? (
            <p style={{ color: 'var(--text-faint)', fontSize: '0.9rem' }}>No one&rsquo;s started yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {peers.map(peer => {
                const sub = peer.submission
                const filledCount = data.claims.filter(c => {
                  const a = sub[c.key as ClaimKey]
                  return (a.empirical || '').trim().length > 0
                }).length
                const isExpanded = expandedStudent === peer.student_id
                return (
                  <div key={peer.student_id} style={teacherRowStyle}>
                    <button
                      onClick={() => onExpand(isExpanded ? null : peer.student_id)}
                      style={teacherRowHeadStyle}
                    >
                      <span style={{ fontWeight: 600 }}>{peer.display_name ?? '(unnamed)'}</span>
                      <span style={teacherRowMetaStyle}>
                        {sub.submitted ? (
                          <span style={{ color: '#2f5d62', fontWeight: 600 }}>✓ Submitted</span>
                        ) : (
                          <span style={{ color: 'var(--text-faint)' }}>Working ({filledCount}/5)</span>
                        )}
                        <span style={{ color: 'var(--text-faint)' }}>{isExpanded ? '▴' : '▾'}</span>
                      </span>
                    </button>
                    {isExpanded && (
                      <div style={teacherRowBodyStyle}>
                        {data.claims.map(c => {
                          const a = sub[c.key as ClaimKey]
                          return (
                            <div key={c.key} style={teacherClaimBlockStyle}>
                              <div style={teacherClaimHeadStyle}>
                                <strong>Claim {c.index}.</strong> {c.claim}
                              </div>
                              <div style={teacherClaimFieldStyle}>
                                <span style={teacherClaimFieldLabelStyle}>Empirical:</span>{' '}
                                <span style={teacherClaimFieldTextStyle}>
                                  {a.empirical?.trim() || <em style={{ color: 'var(--text-faint)' }}>(empty)</em>}
                                </span>
                              </div>
                              <div style={teacherClaimFieldStyle}>
                                <span style={teacherClaimFieldLabelStyle}>Normative:</span>{' '}
                                <span style={teacherClaimFieldTextStyle}>
                                  {a.normative?.trim() || <em style={{ color: 'var(--text-faint)' }}>(empty)</em>}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
  
        {/* Always-on answer key reference for teacher */}
        <div style={teacherSectionStyle}>
          <div style={teacherSectionLabelStyle}>Answer key — for reference</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {data.claims.map(c => {
              const isShown = shownClaims.includes(c.index)
              const isRevealed = revealedClaims.includes(c.index)
              return (
                <div key={c.key} style={teacherAnswerKeyBlockStyle}>
                  <div style={teacherClaimHeadStyle}>
                    <strong>Claim {c.index}.</strong> {c.claim}
                    {isShown && !isRevealed && (
                      <span style={teacherRevealedFlagStyle}>· text shown</span>
                    )}
                    {isRevealed && (
                      <span style={teacherRevealedFlagStyle}>· answer revealed</span>
                    )}
                  </div>
                  <div style={teacherClaimFieldStyle}>
                    <span style={teacherClaimFieldLabelStyle}>Empirical:</span>{' '}
                    <span style={teacherClaimFieldTextStyle}>{c.answerKey.empirical}</span>
                  </div>
                  <div style={teacherClaimFieldStyle}>
                    <span style={teacherClaimFieldLabelStyle}>Normative:</span>{' '}
                    <span style={teacherClaimFieldTextStyle}>{c.answerKey.normative}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

// ---------- Broadcast view (rendered by broadcast-shell, not here) ----------
// This is a no-op placeholder. The broadcast-shell renders a separate component
// for u1-l3 that has its own large-screen layout.

function BroadcastView({
    data, shownClaims, revealedClaims, submittedCount,
  }: {
    data: U1L3ActivityData
    shownClaims: number[]
    revealedClaims: number[]
    submittedCount: number
  }) {
    // The broadcast-shell renders its own large-format component; this is fallback.
    return (
      <div style={containerStyle}>
        <div>
          {submittedCount} submitted · {shownClaims.length} shown · {revealedClaims.length} revealed
        </div>
        {data.claims.map(c => (
          <div key={c.key}>
            {c.index}. {shownClaims.includes(c.index) ? c.claim : '(hidden)'}
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

const claimCardStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '1.25rem 1.5rem',
  marginBottom: '1.25rem',
}

const claimHeadStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '0.85rem',
  marginBottom: '1rem',
  paddingBottom: '0.85rem',
  borderBottom: '1px solid var(--border)',
}

const claimNumStyle: React.CSSProperties = {
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

const claimTextStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.15rem',
  color: 'var(--text)',
  lineHeight: 1.3,
}

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: '1rem',
}

const fieldLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-dim)',
  marginBottom: '0.4rem',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  fontFamily: 'inherit',
  fontSize: '0.92rem',
  lineHeight: 1.5,
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  resize: 'vertical',
  minHeight: '3.5rem',
}

const answerKeyBoxStyle: React.CSSProperties = {
  marginTop: '0.6rem',
  padding: '0.7rem 0.95rem',
  background: 'rgba(200, 169, 110, 0.08)',
  border: '1px solid var(--gold)',
  borderRadius: '6px',
}

const answerKeyLabelStyle: React.CSSProperties = {
  fontSize: '0.62rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  marginBottom: '0.3rem',
}

const answerKeyTextStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: 'var(--text)',
  lineHeight: 1.55,
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

// --- Teacher styles ---

const teacherHeadStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  marginBottom: '1.75rem',
  paddingBottom: '1.25rem',
  borderBottom: '1px solid var(--border)',
  flexWrap: 'wrap',
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

const revealBtnStyle: React.CSSProperties = {
  padding: '0.75rem 1.3rem',
  fontSize: '0.85rem',
  fontWeight: 600,
  letterSpacing: '0.03em',
  color: '#fff',
  background: '#2980b9',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
}

const revealBtnActiveStyle: React.CSSProperties = {
  ...revealBtnStyle,
  background: 'var(--bg2)',
  color: '#2980b9',
  border: '1px solid #2980b9',
}

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
  padding: '0.5rem 1rem 1rem',
  borderTop: '1px solid var(--border)',
  background: 'var(--bg)',
}

const teacherClaimBlockStyle: React.CSSProperties = {
  padding: '0.7rem 0',
  borderBottom: '1px dashed var(--border)',
}

const teacherClaimHeadStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  marginBottom: '0.4rem',
  color: 'var(--text)',
}

const teacherClaimFieldStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  lineHeight: 1.55,
  marginBottom: '0.2rem',
  color: 'var(--text-dim)',
}

const teacherClaimFieldLabelStyle: React.CSSProperties = {
  fontWeight: 600,
  color: '#2980b9',
}

const teacherClaimFieldTextStyle: React.CSSProperties = {
  color: 'var(--text)',
}

const teacherAnswerKeyBlockStyle: React.CSSProperties = {
  padding: '0.85rem 1rem',
  background: 'var(--bg2)',
  borderLeft: '3px solid var(--gold)',
  borderRadius: '0 6px 6px 0',
}

const teacherRevealPanelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.4rem',
  }
  
  const teacherClaimPillRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.4rem',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  }
  
  const teacherClaimPillStyle: React.CSSProperties = {
    padding: '0.45rem 0.85rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
    borderRadius: '999px',
    cursor: 'pointer',
    font: 'inherit',
  }
  
  const teacherRevealHintStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--text-faint)',
    margin: '0.1rem 0 0',
    textAlign: 'right',
    maxWidth: '20rem',
  }
  
  const teacherRevealedFlagStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: '#2980b9',
    marginLeft: '0.5rem',
  }

  const teacherRevealGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    marginBottom: '0.5rem',
  }
  
  const teacherRevealColStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  }
  
  const teacherRevealColLabelStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-dim)',
  }
  
  const teacherClaimPillRowVerticalStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.4rem',
    flexWrap: 'wrap',
  }