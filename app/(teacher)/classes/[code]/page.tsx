import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ClassDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Get class by code
  const { data: classData } = await supabase
    .from('classes')
    .select('id, name, class_code')
    .eq('class_code', code.toUpperCase())
    .single()

  if (!classData) redirect('/dashboard')

  // Get enrolled students
  const { data: enrollments } = await supabase
    .from('class_enrollments')
    .select('student_id')
    .eq('class_id', classData.id)

  let students: { id: string; display_name: string }[] = []
  if (enrollments && enrollments.length > 0) {
    const ids = enrollments.map(e => e.student_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', ids)
    students = profiles ?? []
  }

  return (
    <main style={{ flex: 1, padding: '2.5rem' }}>

      {/* Header + class code top right */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Classes</div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{classData.name}</h1>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>{students.length} students enrolled</p>
        </div>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem 1.5rem', textAlign: 'right' as const }}>
          <div className="eyebrow" style={{ marginBottom: '0.35rem' }}>Class Code</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--gold)', letterSpacing: '0.15em' }}>
            {classData.class_code}
          </div>
        </div>
      </div>

      {/* Students hero */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
          <div className="eyebrow">Students</div>
        </div>
        {students.length === 0 && (
          <div style={{ padding: '3rem', fontSize: '0.875rem', color: 'var(--text-faint)', textAlign: 'center' as const }}>
            No students enrolled yet. Share the class code to get started.
          </div>
        )}
        {students.map((s) => (
          <a
            key={s.id}
            href={`/classes/${code}/students/${s.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gold-dim)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--gold)', flexShrink: 0 }}>
              {s.display_name?.[0] ?? '?'}
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>
              {s.display_name}
            </div>
          </a>
        ))}
      </div>

    </main>
  )
}