// lib/live-session.ts
// Canonical lookup: "what is the current live session for this user?"
// Used by the student live view (via student enrollment lookup) and
// the teacher live view (via class teacher lookup).

import type { SupabaseClient } from '@supabase/supabase-js'

export type LiveSessionLessonRef = {
  id: string
  slug: string
  title: string
  unit: number
  lesson_number: number
  lesson_type: string
}

export type CurrentLiveSession = {
  assignment_id: string
  class_id: string
  status: 'not_started' | 'live' | 'paused'
  current_step: string | null
  activity_revealed: boolean
  started_at: string | null
  lesson: LiveSessionLessonRef
}

/**
 * Find the current (live or paused) assignment for a student.
 * A student is enrolled in classes; we look for any of their enrolled classes
 * to have a live/paused assignment right now. Per current design students
 * are in one class, but the lookup handles multiple cleanly.
 *
 * Returns null if no live session exists for any of the student's classes.
 *
 * Note: `not_started` is intentionally excluded — students don't see anything
 * until the teacher actually starts the session.
 */
export async function getCurrentLiveSessionForStudent(
  supabase: SupabaseClient,
  profileId: string,
): Promise<CurrentLiveSession | null> {
  // Find class IDs the student is enrolled in.
  const { data: enrollments } = await supabase
    .from('class_enrollments')
    .select('class_id')
    .eq('student_id', profileId)

  const classIds = (enrollments ?? []).map((e: { class_id: string }) => e.class_id)
  if (classIds.length === 0) return null

  // Find the live/paused assignment for any of those classes.
  const { data: assignment } = await supabase
    .from('lesson_assignments')
    .select(`
      id,
      class_id,
      status,
      current_step,
      activity_revealed,
      started_at,
      lessons(id, slug, title, unit, lesson_number, lesson_type)
    `)
    .in('class_id', classIds)
    .in('status', ['live', 'paused'])
    .maybeSingle()

  if (!assignment || !assignment.lessons) return null

  const lesson = assignment.lessons as unknown as LiveSessionLessonRef

  return {
    assignment_id: assignment.id,
    class_id: assignment.class_id,
    status: assignment.status as 'live' | 'paused',
    current_step: assignment.current_step,
    activity_revealed: assignment.activity_revealed,
    started_at: assignment.started_at,
    lesson,
  }
}

/**
 * Find the current (not_started, live, or paused) assignment for a teacher's class.
 * Teacher sees the assignment even before they start the session — that's how
 * they get the "Start Session" button on the live page if they navigated there
 * before pressing Start on the curriculum page.
 */
export async function getCurrentSessionForClass(
  supabase: SupabaseClient,
  classId: string,
): Promise<CurrentLiveSession | null> {
  const { data: assignment } = await supabase
    .from('lesson_assignments')
    .select(`
      id,
      class_id,
      status,
      current_step,
      activity_revealed,
      started_at,
      lessons(id, slug, title, unit, lesson_number, lesson_type)
    `)
    .eq('class_id', classId)
    .in('status', ['not_started', 'live', 'paused'])
    .maybeSingle()

  if (!assignment || !assignment.lessons) return null

  const lesson = assignment.lessons as unknown as LiveSessionLessonRef

  return {
    assignment_id: assignment.id,
    class_id: assignment.class_id,
    status: assignment.status as 'not_started' | 'live' | 'paused',
    current_step: assignment.current_step,
    activity_revealed: assignment.activity_revealed,
    started_at: assignment.started_at,
    lesson,
  }
}