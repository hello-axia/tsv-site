import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function StudentAccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('user_id', user.id)
    .single()

  return (
    <main style={{ flex: 1, padding: '2.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Settings</div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Account</h1>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>Your profile and account settings.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem' }}>
          <div className="eyebrow" style={{ marginBottom: '1rem' }}>Profile</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>Name</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{profile?.display_name ?? '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>Email</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{user.email}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>Role</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>Student</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>Member Since</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
            </div>
            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
              <a href="/api/auth/logout" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#c0392b', textDecoration: 'none', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}