import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentLiveSessionForStudent } from '@/lib/live-session'
import { getLessonContentHtml } from '@/lib/lesson-content'
import StudentLiveShell from './student-live-shell'
import type { LessonMeta } from '@/lib/lesson-meta-types'

// Load the lesson sidecar by slug. Returns null if no sidecar exists.
async function loadLessonMeta(slug: string): Promise<LessonMeta | null> {
  try {
    const mod = await import(`@/content/lessons/${slug}.meta`)
    return (mod.meta ?? null) as LessonMeta | null
  } catch {
    return null
  }
}

export default async function StudentLivePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Resolve profile.id from auth user.id (profiles.user_id is the FK).
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/')

    const session = await getCurrentLiveSessionForStudent(supabase, profile.id)
    const briefingHtml = session ? getLessonContentHtml(session.lesson.slug) : null
    const meta = session ? await loadLessonMeta(session.lesson.slug) : null

  return (
    <main style={{ flex: 1, padding: '2.5rem 1.5rem 4rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <StudentLiveShell
          profileId={profile.id}
          initialSession={session}
          briefingHtml={briefingHtml}
          meta={meta}
        />
      </div>
    </main>
  )
}