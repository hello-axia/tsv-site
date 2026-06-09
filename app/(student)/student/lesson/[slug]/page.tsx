import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getLessonContentHtml } from '@/lib/lesson-content'
import type { LessonMeta } from '@/lib/lesson-meta-types'
import { renderStaticBriefing } from '@/lib/briefing-render'
import SubmissionReview from './submission-review'

const LESSON_TYPE_LABELS: Record<string, string> = {
  briefing: 'Briefing',
  artifact_analysis: 'Artifact Analysis',
  deliberation: 'Deliberation',
  civic_action: 'Civic Action',
  reflection: 'Reflection',
  reflection_sharing: 'Reflection Sharing',
}

async function loadLessonMeta(slug: string): Promise<LessonMeta | null> {
  try {
    const mod = await import(`@/content/lessons/${slug}.meta`)
    return (mod.meta ?? null) as LessonMeta | null
  } catch {
    return null
  }
}

export default async function StudentLessonArchivePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!profile) redirect('/')

  // The lesson must exist and be published for a student to see it at all.
  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, slug, title, unit, lesson_number, lesson_type, status')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (!lesson) notFound()

  // Completion gate: a student "completed" this lesson iff they have a ledger entry.
  const { data: ledger } = await supabase
    .from('ledger_entries')
    .select('mc_option_id, written_response')
    .eq('student_id', profile.id)
    .eq('lesson_id', lesson.id)
    .maybeSingle()

  const completed = !!ledger

  // Their activity submission (only fetched/shown if completed).
  let submissionData: unknown = null
  if (completed) {
    const { data: sub } = await supabase
      .from('activity_submissions')
      .select('data')
      .eq('student_id', profile.id)
      .eq('lesson_id', lesson.id)
      .maybeSingle()
    submissionData = sub?.data ?? null
  }

  const briefingHtml = getLessonContentHtml(slug)
  const meta = await loadLessonMeta(slug)
  const lessonTypeLabel = LESSON_TYPE_LABELS[lesson.lesson_type] ?? lesson.lesson_type

  // Resolve the MC choice label from meta, if there was one.
  let mcLabel: string | null = null
  if (ledger?.mc_option_id && meta?.ledger?.mcOptions) {
    mcLabel = meta.ledger.mcOptions.find(o => o.key === ledger.mc_option_id)?.label ?? null
  }

  const hasActivity = !!meta?.activity

  return (
    <main style={{ flex: 1, padding: '2.5rem' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '0.82rem', color: 'var(--text-faint)', marginBottom: '1.5rem' }}>
        <a href="/student/curriculum" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>← Curriculum</a>
        <span style={{ margin: '0 0.5rem' }}>·</span>
        <span>Unit {lesson.unit}, Lesson {lesson.lesson_number}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
          <span style={typeBadgeStyle}>{lessonTypeLabel}</span>
          {completed && <span style={completedBadgeStyle}>✓ Completed</span>}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text)', lineHeight: 1.15, margin: 0 }}>
          {lesson.title}
        </h1>
      </div>

      {/* Not-completed note */}
      {!completed && (
        <div style={notCompletedNoteStyle}>
          You haven&rsquo;t completed this lesson yet. You can read the briefing below — your activity and Ledger entry will appear here once you&rsquo;ve done the lesson in class.
        </div>
      )}

      {/* Briefing — always shown for published lessons */}
      <Section title="The Briefing">
      {briefingHtml ? (
            renderStaticBriefing(briefingHtml, meta)
          ) : (
            <p style={{ color: 'var(--text-faint)' }}>No briefing content authored yet.</p>
          )}
      </Section>

      {/* Activity review — completed only, and only if the lesson has an activity */}
      {completed && hasActivity && (
        <Section title="Your Activity">
          <SubmissionReview slug={slug} data={submissionData} meta={meta} />
        </Section>
      )}

      {/* Ledger — completed only */}
      {completed && ledger && (
        <Section title="Your Ledger Entry">
          {mcLabel && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={ledgerSubLabelStyle}>Your choice</div>
              <div style={ledgerChoiceStyle}>{mcLabel}</div>
            </div>
          )}
          <div style={ledgerSubLabelStyle}>Your written response</div>
          <div style={ledgerWrittenStyle}>{ledger.written_response}</div>
          <div style={privacyLineStyle}>🔒 This is your own record. Your teacher sees that you completed it, not what you wrote.</div>
        </Section>
      )}
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <div style={sectionHeadStyle}>
        <span style={sectionHeadTextStyle}>{title}</span>
        <span style={sectionRuleStyle} />
      </div>
      {children}
    </section>
  )
}

// ---------- styles ----------

const typeBadgeStyle: React.CSSProperties = {
  fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
  background: 'var(--text)', color: 'var(--gold)', padding: '0.25rem 0.55rem', borderRadius: '4px',
}
const completedBadgeStyle: React.CSSProperties = {
  fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
  color: '#2f5d62', background: 'rgba(47, 93, 98, 0.1)', border: '1px solid #2f5d62',
  padding: '0.25rem 0.55rem', borderRadius: '4px',
}
const notCompletedNoteStyle: React.CSSProperties = {
  background: 'var(--bg2)', border: '1px dashed var(--border)', borderRadius: '8px',
  padding: '1rem 1.25rem', marginBottom: '2.5rem', fontSize: '0.9rem',
  color: 'var(--text-dim)', lineHeight: 1.6,
}
const sectionHeadStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem',
}
const sectionHeadTextStyle: React.CSSProperties = {
  fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase',
  color: 'var(--gold)', flexShrink: 0,
}
const sectionRuleStyle: React.CSSProperties = {
  flex: 1, height: '1px', background: 'var(--border)',
}
const ledgerSubLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--text-dim)', marginBottom: '0.5rem',
}
const ledgerChoiceStyle: React.CSSProperties = {
  background: 'var(--gold-dim)', border: '1px solid var(--gold)', borderRadius: '8px',
  padding: '0.85rem 1.1rem', fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.5,
}
const ledgerWrittenStyle: React.CSSProperties = {
  background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px',
  padding: '1.1rem 1.3rem', fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.7,
  whiteSpace: 'pre-wrap',
}
const privacyLineStyle: React.CSSProperties = {
  marginTop: '1rem', fontSize: '0.78rem', color: 'var(--text-faint)',
}