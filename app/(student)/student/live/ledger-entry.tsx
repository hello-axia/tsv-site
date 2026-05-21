'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { LedgerMeta } from '@/lib/lesson-meta-types'

type Props = {
  assignmentId: string
  lessonId: string
  profileId: string
  spec: LedgerMeta
  readOnly?: boolean
}

const MIN_WRITTEN_LENGTH = 10

export default function LedgerEntryComponent({ assignmentId, lessonId, profileId, spec, readOnly = false }: Props) {
  const [mcChoice, setMcChoice] = useState<string | null>(null)
  const [written, setWritten] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submittedEntry, setSubmittedEntry] = useState<{ mcKey: string | null; written: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submissionCount, setSubmissionCount] = useState<number>(0)
  const [classSize, setClassSize] = useState<number>(0)

  // On mount: check if this student already submitted (refresh recovery).
  useEffect(() => {
    if (readOnly) return
    const supabase = createClient()
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('ledger_entries')
        .select('mc_option_id, written_response')
        .eq('student_id', profileId)
        .eq('lesson_id', lessonId)
        .maybeSingle()
      if (cancelled || !data) return
      setSubmitted(true)
      setSubmittedEntry({
        mcKey: data.mc_option_id ?? null,
        written: data.written_response ?? '',
      })
      setMcChoice(data.mc_option_id ?? null)
      setWritten(data.written_response ?? '')
    })()
    return () => { cancelled = true }
  }, [lessonId, profileId, readOnly])

  // Poll: submission count + class size (for the live counter).
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function fetchCount() {
      // Students who have submitted ledger_entries for THIS assignment.
      // Note: ledger_entries unique is (student_id, lesson_id), but we filter
      // by assignment_id for accurate "this session" counts.
      const { count } = await supabase
        .from('ledger_entries')
        .select('*', { count: 'exact', head: true })
        .eq('assignment_id', assignmentId)
      if (cancelled) return
      setSubmissionCount(count ?? 0)
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

    fetchCount()
    fetchClassSize()
    const id = setInterval(fetchCount, 3000)
    return () => { cancelled = true; clearInterval(id) }
  }, [assignmentId])

  async function submit() {
    if (submitting || submitted || readOnly) return
    if (!written.trim() || written.trim().length < MIN_WRITTEN_LENGTH) return
    setSubmitting(true)

    const supabase = createClient()

    const { error } = await supabase
      .from('ledger_entries')
      .upsert({
        student_id: profileId,
        lesson_id: lessonId,
        assignment_id: assignmentId,
        mc_option_id: mcChoice,
        written_response: written.trim(),
        unit_capability: spec.unitCapability,
        privacy_tier: spec.privacyTier,
        submitted_at: new Date().toISOString(),
      }, { onConflict: 'student_id,lesson_id' })

    if (error) {
      alert(`Could not submit your entry. ${error.message}`)
      setSubmitting(false)
      return
    }

    // Stamp lesson_progress.ledger_submitted_at
    await supabase
      .from('lesson_progress')
      .upsert({
        student_id: profileId,
        assignment_id: assignmentId,
        lesson_id: lessonId,
        current_step: 'ledger',
        ledger_submitted_at: new Date().toISOString(),
      }, { onConflict: 'student_id,assignment_id' })

    setSubmittedEntry({ mcKey: mcChoice, written: written.trim() })
    setSubmitted(true)
    setSubmitting(false)
  }

  // --- Render ---

  const hasMc = !!spec.mcQuestion && !!spec.mcOptions && spec.mcOptions.length > 0
  const writtenOk = written.trim().length >= MIN_WRITTEN_LENGTH
  const canSubmit = writtenOk && (!hasMc || !!mcChoice)

  // Teacher read-only view: form with greyed inputs + count.
  if (readOnly) {
    return (
      <div style={containerStyle}>
        <div style={bannerStyle}>
          <span style={bannerTitleStyle}>Civic Journal — New Entry</span>
        </div>

        <div style={bodyStyle}>
          {hasMc && (
            <>
              <div style={questionLabelStyle}>Question 1 — choose one</div>
              <div style={questionTextStyle}>{spec.mcQuestion}</div>
              <div style={mcOptionsStyle}>
                {spec.mcOptions!.map(opt => (
                  <div key={opt.key} style={mcOptionStaticStyle}>
                    <span style={mcMarkStyle} />
                    <span style={mcLabelStyle}>{opt.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={questionLabelStyle}>
            {hasMc ? 'Question 2 — write a few sentences' : 'Write a few sentences'}
          </div>
          <div style={questionTextStyle}>{spec.writtenPrompt}</div>
          <div style={teacherPromptBoxStyle}>
            <em>Students write their response here. You'll see completion, not content (Tier {spec.privacyTier}).</em>
          </div>

          <div style={teacherFooterStyle}>
            <span style={teacherStatStyle}>
              <span style={liveDotInline} />
              {submissionCount} of {classSize || '?'} students submitted
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Student post-submit view.
  if (submitted && submittedEntry) {
    const chosenLabel = submittedEntry.mcKey && spec.mcOptions
      ? spec.mcOptions.find(o => o.key === submittedEntry.mcKey)?.label
      : null
    return (
      <div style={containerStyle}>
        <div style={{ ...bannerStyle, background: 'var(--gold-dim)' }}>
          <span style={bannerTitleStyle}>✓ Submitted to your Ledger</span>
        </div>

        <div style={bodyStyle}>
          {chosenLabel && (
            <>
              <div style={questionLabelStyle}>Your choice</div>
              <div style={submittedChoiceStyle}>{chosenLabel}</div>
            </>
          )}

          <div style={{ ...questionLabelStyle, marginTop: chosenLabel ? '1.5rem' : 0 }}>
            Your response
          </div>
          <div style={submittedWrittenStyle}>{submittedEntry.written}</div>

          <div style={privacyLineStyle}>
            🔒 Your teacher sees that you completed this — your writing stays yours.
          </div>
        </div>
      </div>
    )
  }

  // Student form view.
  return (
    <div style={containerStyle}>
      <div style={bannerStyle}>
        <span style={bannerTitleStyle}>Civic Journal — New Entry</span>
      </div>

      <div style={bodyStyle}>
        {hasMc && (
          <>
            <div style={questionLabelStyle}>Question 1 — choose one</div>
            <div style={questionTextStyle}>{spec.mcQuestion}</div>
            <div style={mcOptionsStyle}>
              {spec.mcOptions!.map(opt => {
                const chosen = mcChoice === opt.key
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setMcChoice(opt.key)}
                    style={{
                      ...mcOptionBtnStyle,
                      background: chosen ? 'var(--gold-dim)' : 'var(--bg)',
                      borderColor: chosen ? 'var(--gold)' : 'var(--border)',
                    }}
                  >
                    <span style={{
                      ...mcMarkStyle,
                      background: chosen ? 'var(--gold)' : 'var(--bg)',
                      borderColor: chosen ? 'var(--gold)' : 'var(--border-light)',
                    }} />
                    <span style={mcLabelStyle}>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        <div style={questionLabelStyle}>
          {hasMc ? 'Question 2 — write a few sentences' : 'Write a few sentences'}
        </div>
        <div style={questionTextStyle}>{spec.writtenPrompt}</div>
        <textarea
          value={written}
          onChange={e => setWritten(e.target.value)}
          placeholder="Start writing here..."
          rows={6}
          style={textareaStyle}
        />
        <div style={writtenFootStyle}>
          <span style={writtenHintStyle}>
            {writtenOk
              ? 'Good — when you\'re ready, submit.'
              : `There's no right answer. Honest is the goal. (${written.trim().length}/${MIN_WRITTEN_LENGTH})`}
          </span>
        </div>

        <button
          onClick={submit}
          disabled={!canSubmit || submitting}
          style={{
            ...submitBtnStyle,
            opacity: !canSubmit || submitting ? 0.5 : 1,
            cursor: !canSubmit || submitting ? 'default' : 'pointer',
          }}
        >
          {submitting ? 'Submitting…' : 'Submit to my Ledger'}
        </button>

        <div style={privacyLineStyle}>
          🔒 Your teacher sees that you completed this — your writing stays yours.
        </div>
      </div>
    </div>
  )
}

// ---------- Styles ----------

const containerStyle: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  overflow: 'hidden',
}

const bannerStyle: React.CSSProperties = {
  background: 'var(--bg2)',
  borderBottom: '1px solid var(--border)',
  padding: '0.9rem 1.5rem',
  display: 'flex',
  alignItems: 'center',
}

const bannerTitleStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-dim)',
}

const bodyStyle: React.CSSProperties = {
  padding: '1.75rem 1.75rem 1.5rem',
}

const questionLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  marginBottom: '0.45rem',
}

const questionTextStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.15rem',
  lineHeight: 1.35,
  color: 'var(--text)',
  marginBottom: '1rem',
}

const mcOptionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  marginBottom: '1.75rem',
}

const mcOptionBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.85rem',
  padding: '0.85rem 1rem',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  textAlign: 'left',
  font: 'inherit',
  width: '100%',
  cursor: 'pointer',
  transition: 'background 0.12s ease, border-color 0.12s ease',
}

const mcOptionStaticStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.85rem',
  padding: '0.85rem 1rem',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  background: 'var(--bg2)',
  opacity: 0.7,
}

const mcMarkStyle: React.CSSProperties = {
  flexShrink: 0,
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  border: '2px solid var(--border-light)',
  marginTop: '3px',
  background: 'var(--bg)',
  transition: 'background 0.12s ease, border-color 0.12s ease',
}

const mcLabelStyle: React.CSSProperties = {
  fontSize: '0.92rem',
  lineHeight: 1.55,
  color: 'var(--text)',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '1rem 1.1rem',
  fontSize: '1rem',
  lineHeight: 1.65,
  fontFamily: 'var(--font-body)',
  color: 'var(--text)',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  resize: 'vertical',
  minHeight: '8rem',
}

const writtenFootStyle: React.CSSProperties = {
  marginTop: '0.5rem',
  marginBottom: '1.25rem',
}

const writtenHintStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  color: 'var(--text-faint)',
}

const submitBtnStyle: React.CSSProperties = {
  padding: '0.85rem 1.4rem',
  fontSize: '0.88rem',
  fontWeight: 600,
  letterSpacing: '0.03em',
  color: '#fff',
  background: 'var(--gold)',
  border: 'none',
  borderRadius: '6px',
}

const privacyLineStyle: React.CSSProperties = {
  marginTop: '1.25rem',
  fontSize: '0.78rem',
  color: 'var(--text-faint)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
}

const submittedChoiceStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  color: 'var(--text)',
  padding: '0.8rem 1rem',
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  lineHeight: 1.5,
}

const submittedWrittenStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  lineHeight: 1.7,
  color: 'var(--text-dim)',
  padding: '1rem 1.1rem',
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  whiteSpace: 'pre-wrap',
}

const teacherPromptBoxStyle: React.CSSProperties = {
  padding: '1rem 1.1rem',
  background: 'var(--bg2)',
  border: '1px dashed var(--border)',
  borderRadius: '8px',
  color: 'var(--text-faint)',
  fontSize: '0.9rem',
  marginBottom: '1rem',
}

const teacherFooterStyle: React.CSSProperties = {
  paddingTop: '0.75rem',
  borderTop: '1px solid var(--border)',
  marginTop: '0.5rem',
}

const teacherStatStyle: React.CSSProperties = {
  fontSize: '0.92rem',
  fontWeight: 600,
  color: 'var(--text)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}

const liveDotInline: React.CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: 'var(--gold)',
  display: 'inline-block',
}