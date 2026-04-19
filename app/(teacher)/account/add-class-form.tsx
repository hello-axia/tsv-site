'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function AddClassForm({ profileId }: { profileId: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const code = generateCode()

    const { error: insertError } = await supabase
      .from('classes')
      .insert({
        name: name.trim(),
        class_code: code,
        teacher_id: profileId,
        school_id: '00000000-0000-0000-0000-000000000000',
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setName('')
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ padding: '0.75rem 1.25rem', background: 'var(--gold)', color: 'var(--bg)', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, cursor: 'pointer' }}
      >
        + New Class
      </button>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem' }}>
      <div className="eyebrow" style={{ marginBottom: '1rem' }}>New Class</div>
      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem' }}>
        Class Name
      </label>
      <input
        type="text"
        placeholder="e.g. AP Gov — Period 3"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleCreate()}
        autoFocus
        style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.9rem', fontFamily: 'sans-serif', outline: 'none', marginBottom: '1rem', boxSizing: 'border-box' as const }}
      />
      {error && <p style={{ fontSize: '0.8rem', color: '#c0392b', marginBottom: '1rem' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={() => { setOpen(false); setName(''); setError('') }}
          style={{ padding: '0.75rem 1.25rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={!name.trim() || loading}
          style={{ padding: '0.75rem 1.25rem', background: 'var(--gold)', color: 'var(--bg)', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, cursor: 'pointer', opacity: !name.trim() || loading ? 0.4 : 1 }}
        >
          {loading ? 'Creating...' : 'Create Class →'}
        </button>
      </div>
    </div>
  )
}