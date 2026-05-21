// content/lessons/u1-l1.teacher.ts
// Teacher notes for "The Cost of Sitting Out" (Briefing).
// Read by /lessons/u1-l1 prep view. Not used at runtime by live session.

import type { LessonTeacherNotes } from '@/lib/lesson-meta-types'

export const teacherNotes: LessonTeacherNotes = {
  slug: 'u1-l1',
  summary:
    "Open the year by surfacing how much politics already affects your students — and how much they currently engage with it. The room's own distribution becomes the diagnosis.",
  estimatedMinutes: 35,

  activity: {
    guide: `<p>Each student drags a dot onto a 2D grid to place themselves on two questions. Dots stay hidden until everyone has placed; when the class is ready, the full distribution reveals at once on the projector, showing where the room actually clusters.</p>
<p><strong>Why this activity:</strong> the Briefing argues that democracy decays when people stop participating. The quadrant forces every student to self-report on the two claims the Briefing rests on — <em>politics affects me</em> and <em>I participate</em>. When the distribution reveals, the diagnosis stops being abstract. It is the room they are sitting in.</p>`,

    callOnScripts: [
      {
        target: 'To an Affected but Tuned Out student',
        line: '"You said political decisions affect your life a lot, but that you tune out. What would have to be true for you to start paying attention?"',
      },
      {
        target: 'To a Disengaged & Unbothered student',
        line: `"You said politics doesn't really affect you. Walk us through that — what's something a politician could do that would affect you?"`,
      },
      {
        target: 'To an Engaged & Affected student',
        line: '"You said you already participate. What made you start?"',
      },
      {
        target: 'To an Engaged but Detached student',
        line: `"You pay attention but said politics doesn't really affect you. Why participate then?"`,
      },
    ],

    closingScript: {
      label: 'Read aloud',
      lines: [
        '"Look at this room. [X]% of you said political decisions affect your life a lot. [Y]% of you said you tune out. That gap — between how much this stuff affects you and how much you engage with it — that\'s the gap this course exists to close.',
        '"Not to make you agree with anyone. Not to turn you into activists. To make sure that when your dot moves on this grid — and it will, over the next year — it moves because you decided to move it. Not because someone louder than you decided for you."',
      ],
    },

    facilitationNotes: [
      {
        title: `Don't moralize.`,
        body: `The bottom quadrants aren't "wrong answers." A student in Disengaged & Unbothered who can articulate why politics doesn't affect them is doing real civic thinking. Treat that answer with the same respect as an Engaged & Affected one.`,
      },
      {
        title: 'Watch for performative placements.',
        body: `Some students place themselves to look good, or to look cool. The anonymous design reduces this, but if you suspect it, the callout questions surface it — performative answers fall apart under "walk us through that."`,
      },
      {
        title: 'If the room is quiet at reveal, name it:',
        body: `"Some of you are surprised by where the room landed. Say more." Don't rush to fill the silence.`,
      },
      {
        title: 'No need to resolve anything.',
        body: `The Apply step plants the question, it doesn't answer it. The Ledger returns students to it.`,
      },
    ],
  },

  ledger: {
    intro: `<p>Every lesson closes with a Ledger entry — about 4 minutes. This is a <strong>Standard</strong> entry: one multiple-choice position question (the tracked data point) and one short written response. Below is exactly what your students will see.</p>`,
  },
}