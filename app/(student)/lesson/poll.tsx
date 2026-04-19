'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type PollOption = { id: string; option_text: string; display_order: number }

export default function LessonPoll({
  question,
  options,
  lessonId,
  studentId,
  existingResponseId,
  existingOptionId,
}: {
  question: string
  options: PollOption[]
  lessonId: string
  studentId: string
  existingResponseId: string | null
  existingOptionId: string | null
}) {
  const [selected, setSelected] = useState<string | null>(existingOptionId)
  const [submitted, setSubmitted] = useState(!!existingOptionId)
  const [loading, setLoading] = useState(false)

  async function handleVote(optionId: string) {
    if (submitted || loading) return
    setLoading(true)
    setSelected(optionId)
    const supabase = createClient()

    if (existingResponseId) {
      await supabase
        .from('lesson_responses')
        .update({ poll_option_id: optionId, submitted_at: new Date().toISOString() })
        .eq('id', existingResponseId)
    } else {
      await supabase
        .from('lesson_responses')
        .insert({ student_id: studentId, lesson_id: lessonId, poll_option_id: optionId, submitted_at: new Date().toISOString() })
    }

    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
      <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.75rem' }}>
        The Verdict
      </p>
      <p style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', marginBottom: '1.5rem', color: 'var(--text)' }}>
        {question}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {options.map((opt) => {
          const isSelected = selected === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              disabled={submitted || loading}
              style={{
                textAlign: 'left',
                padding: '0.875rem 1.25rem',
                border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: '6px',
                background: isSelected ? 'var(--gold-dim)' : 'var(--bg)',
                color: isSelected ? 'var(--gold)' : 'var(--text-dim)',
                fontSize: '0.9rem',
                cursor: submitted ? 'default' : 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
              }}
            >
              {opt.option_text}
            </button>
          )
        })}
      </div>
      {submitted && (
        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          Response recorded.
        </p>
      )}
    </div>
  )
}