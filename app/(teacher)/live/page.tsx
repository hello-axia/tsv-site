import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LivePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  return (
    <main style={{ flex: 1, padding: '2.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Live Session</div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Start a Live Session</h1>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>Assign today&apos;s lesson and monitor student progress in real time.</p>
      </div>

      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '2rem', marginBottom: '1.5rem' }}>
        <div className="eyebrow" style={{ marginBottom: '1rem' }}>Today&apos;s Lesson</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text)', marginBottom: '0.5rem' }}>No lesson assigned</div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-faint)', marginBottom: '1.5rem' }}>Go to Curriculum to assign a lesson before starting a session.</p>
        <a href="/curriculum" style={{ padding: '0.75rem 1.5rem', background: 'var(--gold)', color: 'var(--bg)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none' }}>
          Go to Curriculum →
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem' }}>
          <div className="eyebrow" style={{ marginBottom: '1rem' }}>Student Roster</div>
          {['Marcus T.', 'Priya S.', 'Jordan L.', 'Aisha M.', 'Connor B.'].map((name, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{name}</span>
              <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'var(--bg2)', color: 'var(--text-faint)' }}>Waiting</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem' }}>
          <div className="eyebrow" style={{ marginBottom: '1rem' }}>Poll Results</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-faint)' }}>No poll data yet. Results will appear once students respond.</div>
        </div>
      </div>
    </main>
  )
}