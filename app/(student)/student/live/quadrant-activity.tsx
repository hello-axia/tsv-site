'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { QuadrantActivity } from '@/lib/lesson-meta-types'

type Submission = { x: number; y: number; student_id: string }

type Props = {
  assignmentId: string
  lessonId: string
  profileId: string
  spec: QuadrantActivity
  readOnly?: boolean // teacher view passes true
}

export default function QuadrantActivityComponent({ assignmentId, lessonId, profileId, spec, readOnly = false }: Props) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 })
  const [touched, setTouched] = useState(false)
  const [locked, setLocked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([])
  const [classSize, setClassSize] = useState<number>(0)

  // On mount: check if this student already submitted (e.g. they refreshed mid-lesson).
  useEffect(() => {
    if (readOnly) return
    const supabase = createClient()
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('activity_submissions')
        .select('data')
        .eq('assignment_id', assignmentId)
        .eq('student_id', profileId)
        .maybeSingle()
      if (cancelled || !data) return
      const d = data.data as { x?: number; y?: number }
      if (typeof d.x === 'number' && typeof d.y === 'number') {
        setPos({ x: d.x, y: d.y })
        setLocked(true)
        setTouched(true)
      }
    })()
    return () => { cancelled = true }
  }, [assignmentId, profileId, readOnly])

  // Poll: fetch all submissions for the class + class size.
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function fetchSubmissions() {
      const { data: subs } = await supabase
        .from('activity_submissions')
        .select('data, student_id')
        .eq('assignment_id', assignmentId)
      if (cancelled) return
      const parsed: Submission[] = []
      for (const row of subs ?? []) {
        const d = row.data as { x?: number; y?: number }
        if (typeof d.x === 'number' && typeof d.y === 'number') {
          parsed.push({ x: d.x, y: d.y, student_id: row.student_id })
        }
      }
      setAllSubmissions(parsed)
    }

    async function fetchClassSize() {
      // Find the class for this assignment, then count its enrollments.
      const { data: assignment } = await supabase
        .from('lesson_assignments')
        .select('class_id')
        .eq('id', assignmentId)
        .maybeSingle()
      if (cancelled || !assignment) return
      const { count } = await supabase
        .from('class_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', assignment.class_id)
      if (cancelled) return
      setClassSize(count ?? 0)
    }

    fetchSubmissions()
    fetchClassSize()
    const id = setInterval(fetchSubmissions, 3000)
    return () => { cancelled = true; clearInterval(id) }
  }, [assignmentId])

  // --- Placement input handlers ---
  function placeFromEvent(clientX: number, clientY: number) {
    if (locked || readOnly) return
    const grid = gridRef.current
    if (!grid) return
    const rect = grid.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const yPx = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    const y = 1 - yPx // flip so 1 is top
    setPos({ x, y })
    setTouched(true)
  }

  function onPointerDown(e: React.PointerEvent) {
    if (locked || readOnly) return
    placeFromEvent(e.clientX, e.clientY)
    // Capture pointer to enable drag.
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (locked || readOnly) return
    if (e.buttons === 0) return // not dragging
    placeFromEvent(e.clientX, e.clientY)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (locked || readOnly) return
    const step = e.shiftKey ? 0.1 : 0.04
    let { x, y } = pos
    let handled = true
    if (e.key === 'ArrowLeft') x = Math.max(0, x - step)
    else if (e.key === 'ArrowRight') x = Math.min(1, x + step)
    else if (e.key === 'ArrowUp') y = Math.min(1, y + step)
    else if (e.key === 'ArrowDown') y = Math.max(0, y - step)
    else handled = false
    if (handled) {
      e.preventDefault()
      setPos({ x, y })
      setTouched(true)
    }
  }

  // Derive quadrant key from x/y.
  function quadrantFor(x: number, y: number): string {
    const high_x = x >= 0.5 // affects me
    const high_y = y >= 0.5 // I participate
    if (high_x && high_y) return 'engaged_affected'
    if (!high_x && high_y) return 'engaged_detached'
    if (high_x && !high_y) return 'affected_tuned_out'
    return 'disengaged'
  }

  async function lockIn() {
    if (submitting || locked || readOnly) return
    setSubmitting(true)
    const supabase = createClient()
    const quadrant = quadrantFor(pos.x, pos.y)
    const { error } = await supabase
      .from('activity_submissions')
      .upsert({
        student_id: profileId,
        assignment_id: assignmentId,
        lesson_id: lessonId,
        activity_type: 'quadrant',
        data: { x: pos.x, y: pos.y, quadrant },
        submitted_at: new Date().toISOString(),
      }, { onConflict: 'student_id,assignment_id' })

    if (error) {
      alert(`Could not submit placement. ${error.message}`)
      setSubmitting(false)
      return
    }

    // Also stamp lesson_progress.activity_submitted_at
    await supabase
      .from('lesson_progress')
      .upsert({
        student_id: profileId,
        assignment_id: assignmentId,
        lesson_id: lessonId,
        current_step: 'activity',
        activity_submitted_at: new Date().toISOString(),
      }, { onConflict: 'student_id,assignment_id' })

    setLocked(true)
    setSubmitting(false)
  }

  const submittedCount = allSubmissions.length
  const showOtherDots = locked || readOnly

  // Layout map: which quadrant key sits in which cell of a 2x2 grid laid out
  // top-left → top-right → bottom-left → bottom-right.
  // Top row = "I participate" high. Right col = "affects me" high.
  const cellByPosition: Record<string, string> = {
    'top-left': 'engaged_detached',     // participate hi, affects lo
    'top-right': 'engaged_affected',    // participate hi, affects hi
    'bottom-left': 'disengaged',        // participate lo, affects lo
    'bottom-right': 'affected_tuned_out', // participate lo, affects hi
  }
  const quadrantByKey: Record<string, { label: string; description?: string }> = {}
  for (const q of spec.quadrants) {
    quadrantByKey[q.key] = { label: q.label, description: q.description }
  }

  return (
    <div style={containerStyle}>
      {/* Instruction */}
      {!readOnly && !locked && (
        <p style={instructionStyle}>
          Drag your dot onto the grid. Place it based on <strong>two honest questions</strong> —
          how much politics affects your daily life, and how much you currently take part in it.
        </p>
      )}

      {/* The frame: y-axis + grid + x-axis */}
      <div style={frameStyle}>
      <div style={yAxisStyle}>{spec.yAxis} →</div>

        <div
          ref={gridRef}
          role={readOnly ? undefined : 'application'}
          aria-label={readOnly ? 'Class placement distribution' : 'Place yourself on the quadrant'}
          tabIndex={readOnly || locked ? -1 : 0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onKeyDown={onKeyDown}
          style={{
            ...gridStyle,
            cursor: readOnly || locked ? 'default' : 'pointer',
          }}
        >
          {/* Cells with labels */}
          {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos2 => {
            const key = cellByPosition[pos2]
            const q = quadrantByKey[key]
            return (
              <div key={pos2} style={cellStyle(pos2)}>
                <div style={cellNameStyle}>{q?.label ?? key}</div>
                {q?.description && <div style={cellDescStyle}>{q.description}</div>}
              </div>
            )
          })}

          {/* Other students' dots (anonymous, gray) */}
          {showOtherDots && allSubmissions
            .filter(s => s.student_id !== profileId)
            .map((s, i) => (
              <span
                key={i}
                style={{
                  ...otherDotStyle,
                  left: `${s.x * 100}%`,
                  bottom: `${s.y * 100}%`,
                }}
                aria-hidden="true"
              />
            ))}

          {/* My dot (gold) */}
          {!readOnly && (
            <span
              style={{
                ...myDotStyle,
                left: `${pos.x * 100}%`,
                bottom: `${pos.y * 100}%`,
                opacity: touched ? 1 : 0.5,
              }}
              aria-hidden="true"
            />
          )}
        </div>

        <div style={xAxisStyle}>{spec.xAxis} →</div>
      </div>

      {/* Footer: lock-in button or status */}
      {readOnly ? (
        <div style={teacherFooterStyle}>
          <span style={teacherStatStyle}>
            <span style={liveDotInline} />
            {submittedCount} of {classSize || '?'} students placed
          </span>
        </div>
      ) : !locked ? (
        <div style={footerStyle}>
          <button
            onClick={lockIn}
            disabled={!touched || submitting}
            style={{
              ...lockBtnStyle,
              opacity: !touched || submitting ? 0.5 : 1,
              cursor: !touched || submitting ? 'default' : 'pointer',
            }}
          >
            {submitting ? 'Locking in…' : 'Lock in my placement'}
          </button>
          <p style={hintStyle}>
            Drag the dot anywhere — there&apos;s no wrong spot. Be honest, not impressive.
          </p>
        </div>
      ) : (
        <div style={lockedFooterStyle}>
          <div style={lockedHeaderStyle}>
            <span style={liveDotInline} />
            {submittedCount} of {classSize || '?'} placed · updating live
          </div>
          <p style={anonNoteStyle}>
            🔒 Your placement is <strong>anonymous</strong>. The class sees the overall
            pattern, never who placed where.
          </p>
        </div>
      )}
    </div>
  )
}

// ---------- Styles ----------

const containerStyle: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  padding: '2rem',
}

const instructionStyle: React.CSSProperties = {
  fontSize: '1.02rem',
  lineHeight: 1.65,
  color: 'var(--text-dim)',
  marginBottom: '1.5rem',
  maxWidth: '38rem',
}

const frameStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gridTemplateRows: '1fr auto',
  gap: '0.6rem',
  alignItems: 'stretch',
  marginBottom: '1.5rem',
}

const yAxisStyle: React.CSSProperties = {
  writingMode: 'vertical-rl',
  transform: 'rotate(180deg)',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: 'var(--text-dim)',
  textAlign: 'center',
  alignSelf: 'center',
  paddingRight: '0.25rem',
}

const xAxisStyle: React.CSSProperties = {
  gridColumn: '2 / 3',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: 'var(--text-dim)',
  textAlign: 'center',
  paddingTop: '0.5rem',
}

const gridStyle: React.CSSProperties = {
  position: 'relative',
  aspectRatio: '1 / 1',
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gridTemplateRows: '1fr 1fr',
  gap: '2px',
  background: 'var(--border)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  overflow: 'hidden',
  outline: 'none',
}

function cellStyle(_pos: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'): React.CSSProperties {
  return {
    background: 'var(--bg2)',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    pointerEvents: 'none',
  }
}

const cellNameStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1rem',
  color: 'var(--text)',
  marginBottom: '0.3rem',
  lineHeight: 1.25,
}

const cellDescStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: 'var(--text-faint)',
  lineHeight: 1.4,
}

const myDotStyle: React.CSSProperties = {
  position: 'absolute',
  width: '22px',
  height: '22px',
  borderRadius: '50%',
  background: 'var(--gold)',
  border: '3px solid #fff',
  boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
  transform: 'translate(-50%, 50%)',
  pointerEvents: 'none',
  transition: 'left 0.08s ease, bottom 0.08s ease',
  zIndex: 3,
}

const otherDotStyle: React.CSSProperties = {
  position: 'absolute',
  width: '14px',
  height: '14px',
  borderRadius: '50%',
  background: 'rgba(58, 56, 48, 0.55)',
  border: '2px solid #fff',
  transform: 'translate(-50%, 50%)',
  pointerEvents: 'none',
  zIndex: 2,
}

const footerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '0.65rem',
}

const lockBtnStyle: React.CSSProperties = {
  padding: '0.75rem 1.4rem',
  fontSize: '0.85rem',
  fontWeight: 600,
  letterSpacing: '0.03em',
  color: '#fff',
  background: 'var(--gold)',
  border: 'none',
  borderRadius: '6px',
}

const hintStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  color: 'var(--text-faint)',
  margin: 0,
}

const lockedFooterStyle: React.CSSProperties = {
  paddingTop: '0.5rem',
  borderTop: '1px solid var(--border)',
}

const lockedHeaderStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  fontWeight: 600,
  color: 'var(--text)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.5rem',
}

const anonNoteStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  color: 'var(--text-dim)',
  margin: 0,
  lineHeight: 1.5,
}

const liveDotInline: React.CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: 'var(--gold)',
  display: 'inline-block',
}

const teacherFooterStyle: React.CSSProperties = {
  paddingTop: '0.75rem',
  borderTop: '1px solid var(--border)',
}

const teacherStatStyle: React.CSSProperties = {
  fontSize: '0.92rem',
  fontWeight: 600,
  color: 'var(--text)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}