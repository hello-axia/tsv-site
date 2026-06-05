// content/lessons/u1-l7.teacher.ts
// Teacher notes for "Looking Back" — the Unit 1 capstone Reflection.
// Read by /lessons/u1-l7 prep view. Not used at runtime by the live session.

import type { LessonTeacherNotes } from '@/lib/lesson-meta-types'

export const teacherNotes: LessonTeacherNotes = {
  slug: 'u1-l7',
  summary:
    "The Unit 1 capstone. No new content and no interactive activity — this is a reflection. Students read a short look-back, see a static recap of the unit's four reasoning tools (each tied to the lesson where they practiced it), then write a Ledger entry on what they learned and where they'll use it. Optional verbal class sharing at the end. Your job is to hold the space, not to drive a session.",
  estimatedMinutes: 25,

  activity: {
    guide: `<p>There's nothing to advance here — no phases, no submissions to monitor, no projector choreography. The "activity" step is a read-only recap of the four tools from Unit 1: fact vs. value (Spot the Threads), weighing tradeoffs with the Six Tensions (Liberty vs. Equality), recognizing your own bias (Spotting Your Own Bias), and disagreeing well (Steelman It + the deliberation).</p>
<p><strong>How to run it:</strong> let students read the recap on their own devices, then move them to the Ledger. The recap exists to jog memory before they write — students reflect better on specific work they did than on abstract capability statements. Don't lecture through the four tools; they already lived them.</p>
<p><strong>Class sharing is optional and student-led.</strong> After the Ledger, open the floor: anyone who wants to share a reflection can. Do not cold-call. The Ledger is private (Tier 1) — a student who wrote something honest should not feel pressured to say it aloud. Silence here is fine.</p>`,

    facilitationNotes: [
      {
        title: 'This is a breather, and that\'s the design.',
        body: 'After six lessons of structured work, the capstone is intentionally light. Resist the urge to add rigor. The cognitive work is the reflection itself — naming what they learned in their own words is harder and more valuable than another activity.',
      },
      {
        title: 'Let the recap do the remembering.',
        body: 'Students may not consciously realize they built a toolkit until they see the four tools laid out next to the lessons. Give them a quiet minute with the recap before the writing prompt. The "oh, that\'s what we were doing" moment is the point.',
      },
      {
        title: 'Protect the privacy of the written entry during sharing.',
        body: 'If sharing is quiet, do not pry or call on specific students. A reflection forced aloud stops being a reflection. Frame it as an open invitation and let it sit. If a few students share and it sparks a conversation, let it run — that\'s a good use of the time. If no one does, move on without comment.',
      },
      {
        title: 'Watch for the genuinely stuck student.',
        body: 'A student who writes "I didn\'t learn anything" is usually either disengaged or doesn\'t recognize their own growth. A light prompt helps: "Pick one of the four. When did you use it without realizing? Start there." Don\'t grade the depth — grade that they engaged honestly.',
      },
    ],
  },

  ledger: {
    intro: `<p>This is the only written-only Ledger entry in Unit 1 — no multiple choice, just the prompt. It's a synthesis entry: it asks the student to name what they took from the four tools and where they'll use them. As longitudinal data it's different in kind from the position-measurement MCs of earlier lessons — this one captures self-perceived growth and transfer ("where will you use this"), which is exactly what you want at a unit boundary. Privacy stays Tier 1: you see completion, not content.</p>`,
  },
}