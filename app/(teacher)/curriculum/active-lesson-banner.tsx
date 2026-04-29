'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ActiveLessonBanner({
  assignmentId,
  lessonId,
  lessonTitle,
  unit,
  lessonNumber,
}: {
  assignmentId: string
  lessonId: string
  lessonTitle: string
  unit: number
  lessonNumber: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState<'complete' | 'cancel' | null>(null)

  async function handleComplete() {
    if (loading) return
    setLoading('complete')
    const supabase = createClient()
    const { error } = await supabase
      .from('lesson_assignments')
      .update({ status: 'completed' })
      .eq('id', assignmentId)
    if (error) {
      alert('Could not mark complete. ' + error.message)
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

  return (
    <div style={{
      background: 'var(--gold-dim)',
      border: '1px solid var(--gold)',
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
          color: 'var(--gold)',
          fontWeight: 600,
          marginBottom: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--gold)',
            display: 'inline-block',
          }} />
          Active Lesson
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
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <a
          href={`/lessons/${lessonId}`}
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
        <button
          onClick={handleCancel}
          disabled={!!loading || isPending}
          title="Cancel this assignment (in case of misclick)"
          style={{
            padding: '0.55rem 0.85rem',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#c0392b',
            background: 'transparent',
            border: '1px solid rgba(192,57,43,0.3)',
            borderRadius: '6px',
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading === 'cancel' ? 'Canceling…' : 'Cancel'}
        </button>
        <button
          onClick={handleComplete}
          disabled={!!loading || isPending}
          style={{
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
          }}
        >
          {loading === 'complete' ? 'Marking…' : 'Mark Complete →'}
        </button>
      </div>
    </div>
  )
}