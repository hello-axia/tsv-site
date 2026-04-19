import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function StudentDetailPage({ params }: { params: Promise<{ code: string; studentId: string }> }) {
  const { code, studentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', studentId)
    .single()

  if (!profile) redirect(`/classes/${code}`)

  return (
    <main style={{ flex: 1, padding: '2.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <a href={`/classes/${code}`} style={{ fontSize: '0.8rem', color: 'var(--gold)', textDecoration: 'none' }}>← Back to class</a>
      </div>
      <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Student</div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '2rem' }}>{profile.display_name}</h1>

      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '2rem', color: 'var(--text-faint)', fontSize: '0.875rem' }}>
        More student details coming soon.
      </div>
    </main>
  )
}