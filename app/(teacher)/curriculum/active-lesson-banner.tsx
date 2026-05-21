'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AssignmentStatus = 'not_started' | 'live' | 'paused' | 'completed'

export default function ActiveLessonBanner({
  assignmentId,
  lessonSlug,
  lessonTitle,
  unit,
  lessonNumber,
  status,
}: {
  assignmentId: string
  lessonSlug: string
  lessonTitle: string
  unit: number
  lessonNumber: number
  status: AssignmentStatus
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState<string | null>(null)

  async function startSession() {
    if (loading) return
    setLoading('start')
    const supabase = createClient()
    const { error } = await supabase
      .from('lesson_assignments')
      .update({
        status: 'live',
        current_step: 'briefing',
        started_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
    if (error) {
      alert(`Could not start session. ${error.message}`)
      setLoading(null)
      return
    }
    router.push('/live')
  }

  async function markComplete() {
    if (loading) return
    setLoading('complete')
    const supabase = createClient()
    const { error } = await supabase
      .from('lesson_assignments')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
    if (error) {
      alert(`Could not mark complete. ${error.message}`)
      setLoading(null)
      return
    }
    startTransition(() => router.refresh())
    setLoading(null)
  }

  async function handleCancel() {
    if (loading) return
    if (!confirm('Cancel this assignment? It will be removed entirely.')) return
    setLoading('cancel')
    const supabase = createClient()
    const { error } = await supabase
      .from('lesson_assignments')
      .delete()
      .eq('id', assignmentId)
    if (error) {
      alert('Could not cancel. ' + error.message)
      setLoading(null)
      return
    }
    startTransition(() => router.refresh())
    setLoading(null)
  }

  const palette = status === 'live'
    ? { bg: 'var(--gold-dim)', border: 'var(--gold)', accent: 'var(--gold)', label: 'Live Now', dot: true }
    : status === 'paused'
    ? { bg: 'var(--bg2)', border: 'var(--border)', accent: 'var(--text-dim)', label: 'Paused', dot: false }
    : { bg: 'var(--bg2)', border: 'var(--border)', accent: 'var(--text-dim)', label: 'Queued', dot: false }

  return (
    <div style={{
      background: palette.bg,
      border: `1px solid ${palette.border}`,
      borderRadius: '8px',
      padding: '1.1rem 1.5rem',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.25rem',
      flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.7rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: palette.accent,
          fontWeight: 600,
          marginBottom: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}>
          {palette.dot && (
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: palette.accent,
              display: 'inline-block',
            }} />
          )}
          {palette.label}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.15rem' }}>
          Unit {unit} · Lesson {lessonNumber}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.15rem',
          color: 'var(--text)',
        }}>
          {lessonTitle}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
        <a
          href={`/lessons/${lessonSlug}`}
          style={{
            padding: '0.55rem 1rem',
            fontSize: '0.78rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: 'var(--text-dim)',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            textDecoration: 'none',
          }}
        >
          Open
        </a>

        {status === 'not_started' && (
          <>
            <button
              onClick={handleCancel}
              disabled={!!loading || isPending}
              title="Cancel this assignment"
              style={cancelBtn(loading)}
            >
              {loading === 'cancel' ? 'Canceling…' : 'Cancel'}
            </button>
            <button
              onClick={startSession}
              disabled={!!loading || isPending}
              style={primaryBtn(loading)}
            >
              {loading === 'start' ? 'Starting…' : 'Start Session →'}
            </button>
          </>
        )}

        {(status === 'live' || status === 'paused') && (
          <>
            <a
              href="/live"
              style={{
                ...primaryBtn(loading),
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Go to Live →
            </a>
            <button
              onClick={markComplete}
              disabled={!!loading || isPending}
              style={secondaryBtn(loading)}
            >
              {loading === 'complete' ? 'Marking…' : 'Mark Complete'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function primaryBtn(loading: string | null) {
  return {
    padding: '0.55rem 1.1rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    color: '#fff',
    background: 'var(--gold)',
    border: 'none',
    borderRadius: '6px',
    cursor: loading ? 'default' : 'pointer',
    opacity: loading ? 0.5 : 1,
  } as const
}

function secondaryBtn(loading: string | null) {
  return {
    padding: '0.55rem 0.95rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-dim)',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    cursor: loading ? 'default' : 'pointer',
    opacity: loading ? 0.5 : 1,
  } as const
}

function cancelBtn(loading: string | null) {
  return {
    padding: '0.55rem 0.85rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#c0392b',
    background: 'transparent',
    border: '1px solid rgba(192,57,43,0.3)',
    borderRadius: '6px',
    cursor: loading ? 'default' : 'pointer',
    opacity: loading ? 0.5 : 1,
  } as const
}