import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const CLASSES = [
  { name: 'AP Gov — Period 3', code: 'APG3X7', students: 6, created: 'Sep 2025' },
  { name: 'AP Gov — Period 5', code: 'APG5K2', students: 0, created: 'Sep 2025' },
]

export default async function ClassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  return (
    <main style={{ flex: 1, padding: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Settings</div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Classes</h1>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>Manage your classes and share codes with students.</p>
        </div>
        <button style={{ padding: '0.75rem 1.25rem', background: 'var(--gold)', color: 'var(--bg)', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
          + New Class
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {CLASSES.map((c, i) => (
          <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>{c.name}</div>
              <div className="muted">{c.students} students · Created {c.created}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ textAlign: 'right' as const }}>
                <div className="eyebrow" style={{ marginBottom: '0.25rem' }}>Class Code</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--gold)', letterSpacing: '0.1em' }}>{c.code}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}