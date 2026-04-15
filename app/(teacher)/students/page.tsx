import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const STUDENTS = [
  { name: 'Marcus Thompson', email: 'mthompson@school.edu', lessons: 4, lastActive: 'Today' },
  { name: 'Priya Sharma', email: 'psharma@school.edu', lessons: 4, lastActive: 'Today' },
  { name: 'Jordan Lee', email: 'jlee@school.edu', lessons: 3, lastActive: 'Yesterday' },
  { name: 'Aisha Mohammed', email: 'amohammed@school.edu', lessons: 4, lastActive: 'Today' },
  { name: 'Connor Burke', email: 'cburke@school.edu', lessons: 2, lastActive: '3 days ago' },
  { name: 'Sofia Rivera', email: 'srivera@school.edu', lessons: 4, lastActive: 'Today' },
]

export default async function StudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  return (
    <main style={{ flex: 1, padding: '2.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Students</div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>By Student</h1>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>{STUDENTS.length} students enrolled in AP Gov — Period 3</p>
      </div>

      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
          <div className="eyebrow">Student</div>
          <div className="eyebrow">Lessons</div>
          <div className="eyebrow">Last Active</div>
          <div className="eyebrow">Progress</div>
        </div>
        {STUDENTS.map((s, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px', padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)', marginBottom: '0.1rem' }}>{s.name}</div>
              <div className="muted">{s.email}</div>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{s.lessons} / 170</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>{s.lastActive}</div>
            <div style={{ width: '80px', height: '6px', background: 'var(--bg2)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ width: `${(s.lessons / 170) * 100}%`, height: '100%', background: 'var(--gold)', borderRadius: '999px' }} />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}