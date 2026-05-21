// content/lessons/u1-l1.meta.ts
// Sidecar metadata for "The Cost of Sitting Out" (Briefing).
// Prose, activity HTML, facilitation notes live in u1-l1.html.
// This file exposes only the structured data the app needs at runtime
// (live tallies, activity rendering, ledger submission).

import type { LessonMeta } from '@/lib/lesson-meta-types'

export const meta: LessonMeta = {
  slug: 'u1-l1',

  activity: {
    type: 'quadrant',
    xAxis: 'How much politics affects my daily life',
    yAxis: 'How much I take part',
    quadrants: [
      { key: 'engaged_affected',   label: 'Engaged & Affected',
        description: 'I pay attention, and it affects me' },
      { key: 'engaged_detached',   label: 'Engaged but Detached',
        description: 'I pay attention, but it doesn\'t really affect me' },
      { key: 'affected_tuned_out', label: 'Affected but Tuned Out',
        description: 'It affects me, but I don\'t pay attention' },
      { key: 'disengaged',         label: 'Disengaged & Unbothered',
        description: 'It doesn\'t affect me, and I don\'t pay attention' },
    ],
  },

  ledger: {
    mcQuestion: 'Where did you place yourself on the quadrant today?',
    mcOptions: [
      { key: 'engaged_affected',
        label: 'Engaged & Affected — politics affects me a lot, and I pay attention to it' },
      { key: 'engaged_detached',
        label: 'Engaged but Detached — I pay attention, but politics doesn\'t really affect my life' },
      { key: 'affected_tuned_out',
        label: 'Affected but Tuned Out — politics affects me, but I don\'t pay attention' },
      { key: 'disengaged',
        label: 'Disengaged & Unbothered — politics doesn\'t really affect me, and I don\'t pay attention' },
    ],
    writtenPrompt: 'Why are you there? What could change where you are currently positioned?',
    unitCapability: 'thinking_reasoning',
    privacyTier: 1,
  },
}