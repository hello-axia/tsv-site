import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const UNITS = [
  { unit: 1, title: 'Foundations of American Democracy', lessons: [
    { num: 1, title: 'Why Do Governments Exist?' },
    { num: 2, title: 'The Social Contract' },
    { num: 3, title: 'Why the Constitution Replaced the Articles' },
    { num: 4, title: 'The Federalist Papers' },
    { num: 5, title: 'Separation of Powers' },
  ]},
  { unit: 2, title: 'Interactions Among Branches of Government', lessons: [
    { num: 6, title: 'Powers of Congress' },
    { num: 7, title: 'How a Bill Becomes a Law' },
    { num: 8, title: 'Presidential Powers' },
    { num: 9, title: 'The Federal Bureaucracy' },
    { num: 10, title: 'The Federal Court System' },
  ]},
  { unit: 3, title: 'Civil Liberties and Civil Rights', lessons: [
    { num: 11, title: 'The Bill of Rights' },
    { num: 12, title: 'First Amendment Freedoms' },
    { num: 13, title: 'Due Process and the 14th Amendment' },
    { num: 14, title: 'Equal Protection' },
    { num: 15, title: 'Affirmative Action' },
  ]},
  { unit: 4, title: 'American Political Ideologies and Beliefs', lessons: [
    { num: 16, title: 'Political Socialization' },
    { num: 17, title: 'Public Opinion' },
    { num: 18, title: 'Liberal vs. Conservative' },
    { num: 19, title: 'Political Polling' },
    { num: 20, title: 'Media and Political Beliefs' },
  ]},
  { unit: 5, title: 'Political Participation', lessons: [
    { num: 21, title: 'Voting and Voter Turnout' },
    { num: 22, title: 'Political Parties' },
    { num: 23, title: 'Interest Groups' },
    { num: 24, title: 'Campaign Finance' },
    { num: 25, title: 'Elections and the Electoral College' },
  ]},
  { unit: 6, title: 'Economic and Foreign Policy', lessons: [
    { num: 26, title: 'Fiscal Policy' },
    { num: 27, title: 'Monetary Policy and the Fed' },
    { num: 28, title: 'Social Policy' },
    { num: 29, title: 'Foreign Policy' },
    { num: 30, title: 'Defense and National Security' },
  ]},
]

export default async function StudentCurriculumPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  return (
    <main style={{ flex: 1, padding: '2.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Curriculum</div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>AP Government</h1>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>170 lessons across 6 units.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {UNITS.map((u) => (
          <div key={u.unit} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--gold)', minWidth: '32px' }}>{u.unit}</span>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>{u.title}</div>
                <div className="muted">{u.lessons.length} lessons shown · more coming</div>
              </div>
            </div>
            {u.lessons.map((l) => (
              <div key={l.num} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--gold)', minWidth: '32px' }}>{l.num}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{l.title}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  )
}