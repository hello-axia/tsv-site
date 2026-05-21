// lib/lesson-meta-types.ts
// Shared types for lesson sidecar (.meta.ts) files.
// These describe the structured data the app needs at runtime;
// the prose / activity HTML / facilitation notes live in {slug}.html.

// --- Activities -------------------------------------------------------------
// Discriminated by `type`. Add new activity shapes as new lessons need them.
// Lessons whose activity is just open discussion / not data-backed
// can omit `activity` entirely.

export type QuadrantActivity = {
    type: 'quadrant'
    xAxis: string
    yAxis: string
    quadrants: { key: string; label: string; description?: string }[]
  }
  
  export type McActivity = {
    type: 'mc'
    question: string
    options: { key: string; label: string }[]
  }
  
  // Open-ended / written-only / custom activity — only the type label matters,
  // rendering and prompts live in the HTML.
  export type CustomActivity = {
    type: 'custom'
    label?: string  // optional short label for the teacher's live view
  }
  
  export type ActivityMeta = QuadrantActivity | McActivity | CustomActivity
  
  // --- Ledger -----------------------------------------------------------------
  // Every lesson with a Ledger entry has the same shape: a written response
  // is always required; an MC question is optional (e.g. Reflection Sharing
  // lessons are written-only).
  
  export type LedgerMcOption = { key: string; label: string }
  
  export type LedgerMeta = {
    mcQuestion?: string
    mcOptions?: LedgerMcOption[]
    writtenPrompt: string
    unitCapability: string  // app-validated; values defined per-unit
    privacyTier: 1 | 2      // 1 = teacher sees completion only, 2 = teacher sees content
  }
  
  // --- The top-level shape ----------------------------------------------------
  
  export type LessonMeta = {
    slug: string
    activity?: ActivityMeta
    ledger?: LedgerMeta
  }

  // --- Teacher Notes ---------------------------------------------------------
// Lives in a separate {slug}.teacher.ts sidecar — teacher-only material
// used by the prep view at /lessons/[slug]. Not queried at runtime by the
// live session. Each section is optional so partial authoring works.

export type CallOnScript = {
  target: string  // e.g. "To an Affected but Tuned Out student"
  line: string    // the question to ask
}

export type ClosingScript = {
  label: string   // e.g. "Read aloud"
  lines: string[] // multiple paragraphs
}

export type FacilitationNote = {
  title: string   // bolded lead, e.g. "Don't moralize."
  body: string    // the rest of the note
}

export type LessonTeacherNotes = {
  slug: string

  // Lesson-wide
  summary?: string             // 1-2 sentence "what this lesson does"
  estimatedMinutes?: number    // shown only at top of page

  // Per-stage
  briefing?: {
    notes?: string             // free-form HTML, optional
  }
  activity?: {
    guide?: string             // "Why this activity" prose (HTML)
    callOnScripts?: CallOnScript[]
    closingScript?: ClosingScript
    facilitationNotes?: FacilitationNote[]
  }
  ledger?: {
    intro?: string             // "About this entry" prose (HTML)
  }
}