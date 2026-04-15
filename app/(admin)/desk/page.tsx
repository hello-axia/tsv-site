'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const UNIT_LABELS: Record<number, string> = {
  1: 'Foundations of American Democracy',
  2: 'Interactions Among Branches',
  3: 'Civil Liberties & Civil Rights',
  4: 'American Political Ideologies',
  5: 'Political Participation',
  6: 'Economic & Foreign Policy',
}

export default function AdminDeskPage() {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [unit, setUnit] = useState<number>(1)
  const [lessonNumber, setLessonNumber] = useState('')
  const [articleBody, setArticleBody] = useState('')
  const [pollQuestion, setPollQuestion] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(publishStatus: 'draft' | 'published') {
    if (!title || !lessonNumber || !articleBody || !pollQuestion) {
      setError('Fill in all fields before saving.')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      title,
      unit,
      lesson_number: parseInt(lessonNumber),
      article_body: articleBody,
      poll_question: pollQuestion,
      status: publishStatus,
      published_at: publishStatus === 'published' ? new Date().toISOString() : null,
    }

    const { error: insertError } = await supabase
      .from('lessons')
      .insert(payload)

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)

    // Reset form
    setTitle('')
    setLessonNumber('')
    setArticleBody('')
    setPollQuestion('')
    setStatus('draft')

    setTimeout(() => setSaved(false), 3000)
  }

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #e8e2d9',
    borderRadius: '4px',
    fontSize: '0.9rem',
    fontFamily: 'sans-serif',
    background: '#fff',
    color: '#1a1a14',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#8a8a7a',
    marginBottom: '0.4rem',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f7f4', padding: '3rem 2rem', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c8a96e', marginBottom: '0.4rem' }}>
            Admin · The Student's Verdict
          </p>
          <h1 style={{ fontSize: '1.75rem', fontFamily: 'Georgia, serif', color: '#1a1a14', margin: 0 }}>
            New Lesson
          </h1>
        </div>

        {/* Form */}
        <div style={{ background: '#fff', border: '1px solid #e8e2d9', borderRadius: '8px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Title */}
          <div>
            <label style={labelStyle}>Lesson Title</label>
            <input
              type="text"
              placeholder="e.g. Why Do Governments Exist?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Unit + Lesson Number */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Unit</label>
              <select
                value={unit}
                onChange={e => setUnit(parseInt(e.target.value))}
                style={inputStyle}
              >
                {Object.entries(UNIT_LABELS).map(([num, label]) => (
                  <option key={num} value={num}>Unit {num} — {label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Lesson #</label>
              <input
                type="number"
                placeholder="1"
                min="1"
                max="170"
                value={lessonNumber}
                onChange={e => setLessonNumber(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Article Body */}
          <div>
            <label style={labelStyle}>Article Body</label>
            <p style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem', marginTop: 0 }}>
              This is the full lesson text students read. Write in paragraphs — IDU sections can be added later with a structured editor.
            </p>
            <textarea
              placeholder="Write the lesson article here..."
              value={articleBody}
              onChange={e => setArticleBody(e.target.value)}
              rows={18}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
            />
          </div>

          {/* Poll Question */}
          <div>
            <label style={labelStyle}>Poll Question</label>
            <p style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem', marginTop: 0 }}>
              The yes/no or agree/disagree question shown at the bottom of the lesson.
            </p>
            <input
              type="text"
              placeholder="e.g. Should the federal government set a minimum wage?"
              value={pollQuestion}
              onChange={e => setPollQuestion(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Error */}
          {error && (
            <p style={{ fontSize: '0.8rem', color: '#c0392b', margin: 0 }}>{error}</p>
          )}

          {/* Success */}
          {saved && (
            <p style={{ fontSize: '0.8rem', color: '#4a7c59', margin: 0 }}>✓ Lesson saved successfully.</p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #e8e2d9',
                borderRadius: '4px',
                background: '#fff',
                color: '#5a5a4a',
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.5 : 1,
              }}
            >
              Save Draft
            </button>
            <button
              onClick={() => handleSave('published')}
              disabled={saving}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '4px',
                background: '#c8a96e',
                color: '#1a1a14',
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Publish Lesson →'}
            </button>
          </div>

        </div>

        {/* Nav to lesson list — placeholder */}
        <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#aaa' }}>
          Published lessons will appear on the student lesson page and teacher dashboard automatically.
        </p>

      </div>
    </div>
  )
}