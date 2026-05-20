import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import ClassSelector from '../_components/class-selector'

export default async function LivePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/onboarding?role=teacher')

  const { data: classes } = await supabase
    .from('classes')
    .select('id, class_code, name')
    .eq('teacher_id', profile.id)
    .order('name')

  const cookieStore = await cookies()
  const selectedClassCookie = cookieStore.get('selected_class_id')?.value
  const selectedClassId = (classes ?? []).find(c => c.id === selectedClassCookie)?.id
    ?? classes?.[0]?.id
    ?? null

  return (
    <main style={{ flex: 1, padding: '2.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Live Session</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '0.25rem', color: 'var(--text)' }}>
          Live Session
        </h1>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>
          Real-time student progress, activity submissions, and Ledger entries — being rebuilt.
        </p>
      </div>

      {classes && classes.length > 0 && (
        <ClassSelector classes={classes} selectedId={selectedClassId} />
      )}

      <div style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '3rem 2rem',
        textAlign: 'center',
        marginTop: '1.5rem',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text)', marginBottom: '0.75rem' }}>
          Coming soon
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
          The new live session view is being built — teacher control screen, live student
          progress, activity reveal, and Ledger submissions in real time.
        </p>
        <a href="/curriculum" style={{
          display: 'inline-block',
          padding: '0.6rem 1.1rem',
          background: 'var(--gold)',
          color: '#fff',
          borderRadius: '6px',
          fontSize: '0.82rem',
          fontWeight: 600,
          textDecoration: 'none',
        }}>
          Go to Curriculum →
        </a>
      </div>
    </main>
  )
}