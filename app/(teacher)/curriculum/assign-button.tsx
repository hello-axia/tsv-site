'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AssignButton({
  lessonId,
  classId,
  disabled,
}: {
  lessonId: string
  classId: string
  disabled: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)

  async function handleAssign() {
    if (disabled || loading) return
    setLoading(true)
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .from('lesson_assignments')
      .insert({ lesson_id: lessonId, class_id: classId, assigned_date: today, status: 'active' })

    if (!error) {
      startTransition(() => router.refresh())
    } else {
      console.error('assign error:', error)
      alert('Could not assign lesson. ' + error.message)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleAssign}
      disabled={loading || isPending || disabled}
      title={disabled ? 'Complete the active lesson first.' : ''}
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
      {loading ? '...' : 'Assign'}
    </button>
  )
}