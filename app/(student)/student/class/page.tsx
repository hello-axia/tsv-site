import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function StudentClassPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Get current user's profile id
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!myProfile) redirect('/')

  // Get class via enrollment
  const { data: myEnrollment } = await supabase
    .from('class_enrollments')
    .select('class_id, classes(id, name)')
    .eq('student_id', myProfile.id)
    .single()

  const classId = (myEnrollment?.classes as any)?.id
  const className = (myEnrollment?.classes as any)?.name ?? 'AP Gov'

  // Get all enrollments in the class
  let classmates: { display_name: string }[] = []
  if (classId) {
    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('student_id')
      .eq('class_id', classId)

    if (enrollments && enrollments.length > 0) {
      const studentIds = enrollments.map(e => e.student_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('display_name')
        .in('id', studentIds)
      classmates = profiles ?? []
    }
  }

  return (
    <main style={{ flex: 1, padding: '2.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Class</div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{className}</h1>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>{classmates.length} students enrolled</p>
      </div>

      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
          <div className="eyebrow">Classmates</div>
        </div>
        {classmates.length === 0 && (
          <div style={{ padding: '2rem', fontSize: '0.875rem', color: 'var(--text-faint)' }}>No classmates yet.</div>
        )}
        {classmates.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gold-dim)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--gold)' }}>
              {c.display_name?.[0] ?? '?'}
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>
              {c.display_name ?? 'Unknown'}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}