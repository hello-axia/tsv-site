'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ReassignButton({
  assignmentId,
  disabled,
}: {
  assignmentId: string
  disabled: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)

  async function handleReopen() {
    if (disabled || loading) return
    if (!confirm('Reopen this lesson? Student responses are kept — the lesson returns to your queue so you can run it again. Start it from the banner when ready.')) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('lesson_assignments')
      .update({ status: 'not_started', current_step: 'briefing', ended_at: null })
      .eq('id', assignmentId)
    if (!error) {
      startTransition(() => router.refresh())
    } else {
      console.error('reopen error:', error)
      alert('Could not reopen lesson. ' + error.message)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleReopen}
      disabled={loading || isPending || disabled}
      title={disabled ? 'Another lesson is active for this class. Complete it first.' : 'Reopen for the class — responses are kept'}
      style={{
        padding: '0.35rem 0.85rem',
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        background: 'transparent',
        border: '1px solid ' + (disabled ? 'var(--border)' : 'var(--gold)'),
        color: disabled ? 'var(--text-faint)' : 'var(--gold)',
        borderRadius: '4px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.55 : 1,
      }}
    >
      {loading ? '...' : '↺ Reopen'}
    </button>
  )
}