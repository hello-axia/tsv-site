'use client'

import { usePathname } from 'next/navigation'

type Class = { id: string; name: string; class_code: string }

export default function TeacherNav({ classes }: { classes: Class[] }) {
  const pathname = usePathname()

  const navLink = (name: string, href: string) => {
    const active = pathname === href
    return (
      <a
        key={href}
        href={href}
        style={{
          display: 'block',
          padding: '0.55rem 1.25rem',
          fontSize: '0.85rem',
          color: active ? 'var(--gold)' : 'var(--text-dim)',
          background: active ? 'var(--gold-dim)' : 'transparent',
          borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
          textDecoration: 'none',
        }}
      >
        {name}
      </a>
    )
  }

  return (
    <nav style={{ width: '220px', background: 'var(--bg)', borderRight: '1px solid var(--border)', padding: '1.5rem 0', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
      <div style={{ padding: '0 1.25rem', marginBottom: '1.5rem' }}>
        <a href="/dashboard" style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text)', textDecoration: 'none' }}>
          The Student&apos;s <span style={{ color: 'var(--gold)' }}>Verdict</span>
        </a>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <div className="eyebrow" style={{ padding: '0 1.25rem', marginBottom: '0.4rem' }}>Overview</div>
        {navLink('Dashboard', '/dashboard')}
        {navLink('Curriculum', '/curriculum')}
        {navLink('Live Session', '/live')}
        <div style={{ height: '1px', background: 'var(--border)', margin: '0.75rem 1.25rem' }} />
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <div className="eyebrow" style={{ padding: '0 1.25rem', marginBottom: '0.4rem' }}>Classes</div>
        {classes.length === 0 && (
          <div style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-faint)' }}>No classes yet</div>
        )}
        {classes.map((c) => navLink(c.name, `/classes/${c.class_code}`))}
        <div style={{ height: '1px', background: 'var(--border)', margin: '0.75rem 1.25rem' }} />
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <div className="eyebrow" style={{ padding: '0 1.25rem', marginBottom: '0.4rem' }}>Settings</div>
        {navLink('Account', '/account')}
        <div style={{ height: '1px', background: 'var(--border)', margin: '0.75rem 1.25rem' }} />
      </div>
    </nav>
  )
}