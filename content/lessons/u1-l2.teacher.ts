// content/lessons/u1-l2.teacher.ts
// Teacher notes for "The Six Tensions of American Politics" (Briefing).
// Read by /lessons/u1-l2 prep view. Not used at runtime by the live session.

import type { LessonTeacherNotes } from '@/lib/lesson-meta-types'

export const teacherNotes: LessonTeacherNotes = {
  slug: 'u1-l2',
  summary:
    'Introduce the Six Tensions framework and walk the class through three Liberty vs. Equality scenarios. The goal isn\'t to settle the trade-off — it\'s to model what engaging with a real tension looks like.',
  estimatedMinutes: 40,

  activity: {
    guide: `<p>Students see three scenarios delivered one at a time. For each, they drag a slider somewhere between a Liberty end and an Equality end. Placements stay hidden until the class is finished; when the room is ready, the full distribution reveals at once on the projector. After each reveal, you lead a short structured discussion before moving to the next scenario.</p>
<p><strong>Why this activity:</strong> the Briefing argues that most political fights are really one of six underlying tensions. The slider isolates one of them — Liberty vs. Equality — and forces students to take a position three times across three very different policy areas. The reveals are designed to show students that thoughtful people in their own room land in different places for real reasons, not because someone is stupid or evil.</p>
<p><strong>Total time:</strong> ~2 minutes of discussion per scenario, plus ~30 seconds for reading and sliding. Three scenarios × 2.5 min ≈ 7–8 minutes of activity time.</p>`,

    callOnScripts: [
      {
        target: 'When the class is split (rough 50/50)',
        line: 'Call on one student from each end. The contrast does the work.',
      },
      {
        target: 'When the class clusters heavily on one end',
        line: 'Call on a student from the majority side first, then find a student from the minority side. The minority voice is more valuable here — it shows the class that the other side has real reasoning behind it, not just contrarianism.',
      },
      {
        target: 'When the class clusters in the middle',
        line: 'Call on a middle student and ask what made them resist sliding all the way to either end. The tension is the middle here.',
      },
      {
        target: 'Question — engaging with the reasoning',
        line: '"What part of the value argument on your side actually convinced you?"',
      },
      {
        target: 'Question — strongest opposing point (highest value)',
        line: '"What\'s the strongest part of the other side\'s argument that you still had to push past?"',
      },
      {
        target: 'Question — when a student seems locked in',
        line: '"If someone slid all the way to the other end, what do you think they\'re prioritizing that you aren\'t?"',
      },
    ],

    closingScript: {
      label: 'After Scenario 3 — read aloud',
      lines: [
        '"Three scenarios. All Liberty vs. Equality. And you probably didn\'t land in the exact same place all three times — most people don\'t. That\'s the tension working the way it\'s supposed to. The same value that feels obvious in one scenario starts to feel less obvious when the stakes shift.',
        '"This is one of six. Over the rest of the year, we\'ll work through the other five. By the end, when you watch a political fight on the news or at a dinner table, you\'ll be able to name what the fight is actually about — and that changes how the fight feels."',
      ],
    },

    facilitationNotes: [
      {
        title: 'Read the room before calling on anyone.',
        body: 'When the distribution reveals, take five seconds to actually look at it. Where did the class cluster? Is there a clear majority on one end, a split, or a bell curve in the middle? Your callouts depend on the shape — use the patterns in the "calling on students" script above.',
      },
      {
        title: 'Ask the right question, not "why did you pick that?"',
        body: '"Why did you pick that" invites defensive justification. Use the three framed questions instead. The strongest version is "what\'s the strongest part of the other side\'s argument that you still had to push past?" — a student who can articulate the other side\'s best point is doing exactly the thinking the Briefing wants to build.',
      },
      {
        title: 'Call on two students per scenario, max.',
        body: 'Resist the urge to hear from more — this is a 7-minute Apply step, not a debate club. Two voices per scenario, six total, then you\'re out.',
      },
      {
        title: 'Adjudicate the reasoning, not the position.',
        body: 'You are not deciding who is right. You are deciding whether the reasoning is sound. When a student engages with the value argument and acknowledges the trade-off: "That\'s the tension working the way it\'s supposed to. You picked a side, but you can name what you\'re giving up to pick it. That\'s the move." When a student restates the policy without the reasoning or dismisses the other side: "Push further — why does that argument hold?" or "The whole point is that both arguments have real weight. What\'s the strongest version of the side you didn\'t pick?"',
      },
      {
        title: 'Don\'t resolve the scenario. Move on.',
        body: 'After two students have spoken, transition: "Okay — next scenario." Do not summarize, declare a winner, or say "great points on both sides." The lack of resolution is intentional. The Briefing said these are trade-offs, not problems to solve. If you wrap each scenario with a tidy summary, you\'re teaching the opposite lesson.',
      },
      {
        title: 'You\'re modeling the move in front of the room.',
        body: 'Students learn what engaging with a tension looks like by watching you do it in real time. Your tone, your follow-ups, your willingness to sit with disagreement — that\'s what the lesson is actually teaching. The slider is the prop.',
      },
    ],
  },

  ledger: {
    intro: `<p>Every lesson closes with a Ledger entry — about 4 minutes. This is a <strong>Standard</strong> entry: a 1–7 position scale on Liberty vs. Equality (the tracked data point across the year) and one short written response. The written prompt asks students to engage with the strongest version of the side they didn't pick — the same move the activity practiced.</p>`,
  },
}