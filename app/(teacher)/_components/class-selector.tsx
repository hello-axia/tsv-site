'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Class = { id: string; class_code: string; name: string }

export default function ClassSelector({
  classes,
  selectedId,
}: {
  classes: Class[]
  selectedId: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newId = e.target.value
    document.cookie = `selected_class_id=${newId}; path=/; max-age=${60 * 60 * 24 * 365}`
    startTransition(() => router.refresh())
  }

  if (classes.length === 1) {
    const c = classes[0]
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.85rem 1.25rem',
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        marginBottom: '1.5rem',
      }}>
        <span style={{
          fontSize: '0.7rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--gold)',
          fontWeight: 600,
        }}>
          Active Class
        </span>
        <span style={{ fontSize: '0.95rem', color: 'var(--text)', fontWeight: 500 }}>{c.name}</span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}>· {c.class_code}</span>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.85rem 1.25rem',
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      marginBottom: '1.5rem',
    }}>
      <label
        htmlFor="class-select"
        style={{
          fontSize: '0.7rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--gold)',
          fontWeight: 600,
        }}
      >
        Active Class
      </label>
      <select
        id="class-select"
        value={selectedId ?? ''}
        onChange={handleChange}
        disabled={isPending}
        style={{
          padding: '0.4rem 0.75rem',
          fontSize: '0.92rem',
          fontFamily: 'var(--font-body)',
          color: 'var(--text)',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          cursor: 'pointer',
          minWidth: '200px',
          fontWeight: 500,
        }}
      >
        {classes.map(c => (
          <option key={c.id} value={c.id}>
            {c.name} · {c.class_code}
          </option>
        ))}
      </select>
    </div>
  )
}