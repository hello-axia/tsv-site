// app/api/broadcast/[code]/state/route.ts
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const classCode = code.toUpperCase()
  const supabase = createAdminClient()

  // 1. Resolve class.
  const { data: classRow } = await supabase
    .from('classes')
    .select('id, name, class_code')
    .eq('class_code', classCode)
    .maybeSingle()

  if (!classRow) {
    return NextResponse.json({ status: 'no_class' })
  }

  // 2. Class enrollment count (for denominators).
  const { count: enrollmentCount } = await supabase
    .from('class_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classRow.id)

  // 3. Active assignment for this class.
  const { data: assignment } = await supabase
    .from('lesson_assignments')
    .select(`
      id, status, current_step, activity_revealed, activity_state,
      lessons(id, slug, title, unit, lesson_number, lesson_type)
    `)
    .eq('class_id', classRow.id)
    .in('status', ['live', 'paused'])
    .maybeSingle()

  if (!assignment || !assignment.lessons) {
    return NextResponse.json({
      status: 'waiting',
      className: classRow.name,
      classCode: classRow.class_code,
    })
  }

  const lesson = assignment.lessons as unknown as {
    id: string; slug: string; title: string;
    unit: number; lesson_number: number; lesson_type: string
  }

  // 4. Activity submissions.
  // For quadrant lessons (u1-l1), placements: { x, y }[] is pre-extracted.
  // For custom lessons (u1-l2+), submissions: unknown[] carries the raw payload
  // and the broadcast shell parses per-lesson. Both are returned for clarity.
  const { data: subs } = await supabase
    .from('activity_submissions')
    .select('data, student_id')
    .eq('assignment_id', assignment.id)

  const placements: { x: number; y: number }[] = []
  for (const row of subs ?? []) {
    const d = row.data as { x?: number; y?: number }
    if (typeof d.x === 'number' && typeof d.y === 'number') {
      placements.push({ x: d.x, y: d.y })
    }
  }

  const submissions = (subs ?? []).map(row => ({
    student_id: row.student_id as string,
    data: row.data as unknown,
  }))
  // 5. Ledger submission count.
  const { count: ledgerCount } = await supabase
    .from('ledger_entries')
    .select('*', { count: 'exact', head: true })
    .eq('assignment_id', assignment.id)

    return NextResponse.json({
        status: assignment.status as 'live' | 'paused',
        currentStep: assignment.current_step,
        activityState: (assignment.activity_state ?? {}) as Record<string, unknown>,
        className: classRow.name,
        classCode: classRow.class_code,
        enrollmentCount: enrollmentCount ?? 0,
        lesson: {
          slug: lesson.slug,
          title: lesson.title,
          unit: lesson.unit,
          lessonNumber: lesson.lesson_number,
          lessonType: lesson.lesson_type,
        },
        placements,
        placementCount: placements.length,
        submissions,
        ledgerCount: ledgerCount ?? 0,
      })
}