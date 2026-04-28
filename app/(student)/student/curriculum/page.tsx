import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const UNITS = [
  { unit: 1, title: 'How to Think Like a Citizen', lessons: [
    { num: 1, title: 'The Cost of Sitting Out' },
    { num: 2, title: 'Who Decides?' },
    { num: 3, title: 'When Rights Collide' },
    { num: 4, title: 'When the System Breaks' },
    { num: 5, title: 'Reasonable People, Opposite Conclusions' },
    { num: 6, title: 'The Rules Themselves' },
    { num: 7, title: "Whose Job Is It?" },
    { num: 8, title: 'When Two Laws Disagree' },
    { num: 9, title: 'Same Country, Different Realities' },
  ]},
  { unit: 2, title: 'How to Read a Decision', lessons: [
    { num: 1, title: 'When the System Slows Down' },
    { num: 2, title: 'The Power of the Purse' },
    { num: 3, title: 'Why Members Vote the Way They Do?' },
    { num: 4, title: 'What Counts as Executive Action?' },
    { num: 5, title: 'When Congress Pushes Back' },
    { num: 6, title: 'Power that Stays' },
    { num: 7, title: 'Speaking Past Congress' },
    { num: 8, title: 'Who Gets to Be a Justice?' },
    { num: 9, title: 'What are Judges For?' },
    { num: 10, title: 'Reading the Same Words, Differently' },
    { num: 11, title: 'When Should Courts Be Checked?' },
    { num: 12, title: 'Who Actually Runs the Government?' },
    { num: 13, title: 'Filling in the Blanks' },
    { num: 14, title: 'Who Watches the Watchers?' },
    { num: 15, title: "Who's Responsible When Things Go Wrong?" },
  ]},
  { unit: 3, title: 'How to Weigh a Tradeoff', lessons: [
    { num: 1, title: "Why Rights Aren't Free" },
    { num: 2, title: 'When Faith Meets Law' },
    { num: 3, title: 'Speech that Hurts' },
    { num: 4, title: 'When Journalists Have Secrets' },
    { num: 5, title: 'Who Gets to Have Guns?' },
    { num: 6, title: 'When Safety Costs Freedom' },
    { num: 7, title: 'When the Bill of Rights Reaches You' },
    { num: 8, title: 'When the Wrong Person Goes to Prison' },
    { num: 9, title: 'What Counts as Private?' },
    { num: 10, title: 'When Movements Force Change' },
    { num: 11, title: 'When the Government Responds' },
    { num: 12, title: 'When the Many Outvote the Few' },
    { num: 13, title: 'When Equality Itself is Contested' },
  ]},
  { unit: 4, title: 'How to Locate Yourself', lessons: [
    { num: 1, title: 'Where Did Your Politics Come From?' },
    { num: 2, title: 'The Algorithm That Knows You' },
    { num: 3, title: 'When People Change Their Minds' },
    { num: 4, title: 'When the World Pushes Back' },
    { num: 5, title: 'When the Numbers Lie' },
    { num: 6, title: 'How to Read a Number' },
    { num: 7, title: 'What Does Your Side Actually Believe?' },
    { num: 8, title: 'When Belief Meets Governing' },
    { num: 9, title: 'The Economy as a Mirror' },
    { num: 10, title: 'The Social Question' },
  ]},
  { unit: 5, title: 'How to Actually Engage', lessons: [
    { num: 1, title: 'Why Vote?' },
    { num: 2, title: "Why Don't People Vote?" },
    { num: 3, title: 'Why Two Parties?' },
    { num: 4, title: 'When Parties Change' },
    { num: 5, title: "When the Two Parties Aren't Enough" },
    { num: 6, title: "Who's Lobbying for You?" },
    { num: 7, title: 'Who Has the Loudest Voice?' },
    { num: 8, title: 'How Presidents Get Elected' },
    { num: 9, title: "Why Your Congressional District Probably Doesn't Matter" },
    { num: 10, title: 'How Modern Campaigns Actually Work' },
    { num: 11, title: 'Where Does the Money Come From?' },
    { num: 12, title: 'Where Do You Get Your News?' },
    { num: 13, title: 'When the Algorithm Is the Editor' },
  ]},
]

type LessonRow = { id: string; unit: number; lesson_number: number; status: string }

export default async function StudentCurriculumPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: lessonRows } = await supabase
    .from('lessons')
    .select('id, unit, lesson_number, status')
    .eq('status', 'published')

  const lessonMap: Record<string, LessonRow> = {}
  for (const row of lessonRows ?? []) {
    lessonMap[`${row.unit}-${row.lesson_number}`] = row
  }

  return (
    <main style={{ flex: 1, padding: '2.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Curriculum</div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>AP Government</h1>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>60 lessons across 5 units.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {UNITS.map((u) => (
          <div key={u.unit} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--gold)', minWidth: '32px' }}>{u.unit}</span>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>{u.title}</div>
                <div className="muted">{u.lessons.length} lessons</div>
              </div>
            </div>
            {u.lessons.map((l) => {
              const row = lessonMap[`${u.unit}-${l.num}`]
              const available = !!row
              return (
                <div key={l.num} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--gold)', minWidth: '32px' }}>{u.unit}.{l.num}</span>
                  {available ? (
                    <a
                      href={`/student/lesson/${row.id}`}
                      style={{ fontSize: '0.85rem', color: 'var(--text)', textDecoration: 'none', flex: 1 }}
                    >
                      {l.title}
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-faint)', flex: 1 }}>{l.title}</span>
                  )}
                  <span style={{
                    fontSize: '0.7rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: available ? 'var(--gold)' : 'var(--text-faint)',
                    fontWeight: 600,
                  }}>
                    {available ? 'Available' : 'Coming Soon'}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </main>
  )
}