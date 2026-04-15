'use client'

import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'Overview', items: [{ name: 'Dashboard', href: '/dashboard' }, { name: 'Curriculum', href: '/curriculum' }, { name: 'Live Session', href: '/live' }] },
  { label: 'Students', items: [{ name: 'By Student', href: '/students' }] },
  { label: 'Settings', items: [{ name: 'Classes', href: '/classes' }, { name: 'Account', href: '/account' }] },
]

export default function TeacherNav() {
  const pathname = usePathname()

  return (
    <nav style={{ width: '220px', background: 'var(--bg)', borderRight: '1px solid var(--border)', padding: '1.5rem 0', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
      <div style={{ padding: '0 1.25rem', marginBottom: '1.5rem' }}>
        <a href="/dashboard" style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text)', textDecoration: 'none' }}>
          The Student&apos;s <span style={{ color: 'var(--gold)' }}>Verdict</span>
        </a>
      </div>

      <div style={{ margin: '0 1.25rem 1.5rem', padding: '0.75rem', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '6px' }}>
        <div className="eyebrow" style={{ marginBottom: '0.35rem' }}>Class</div>
        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>AP Gov — Period 3</div>
      </div>

      {NAV.map((section) => (
        <div key={section.label} style={{ marginBottom: '1.25rem' }}>
          <div className="eyebrow" style={{ padding: '0 1.25rem', marginBottom: '0.4rem' }}>{section.label}</div>
          {section.items.map((item) => {
            const active = pathname === item.href
            return (
              <a
                key={item.name}
                href={item.href}
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
                {item.name}
              </a>
            )
          })}
          <div style={{ height: '1px', background: 'var(--border)', margin: '0.75rem 1.25rem' }} />
        </div>
      ))}
    </nav>
  )
}