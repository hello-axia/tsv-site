// content/lessons/u1-l3.teacher.ts
// Teacher notes for "Empirical vs. Normative" (Briefing).
// Read by /lessons/u1-l3 prep view. Not used at runtime by the live session.

import type { LessonTeacherNotes } from '@/lib/lesson-meta-types'

export const teacherNotes: LessonTeacherNotes = {
  slug: 'u1-l3',
  summary:
    'Teach the empirical / normative distinction by walking through the minimum wage debate, then have pairs untangle five political claims into their two threads. The answer key reveal is the closing move.',
  estimatedMinutes: 40,

  activity: {
    guide: `<p>Students work in pairs through a digital worksheet of 5 political claims. Each claim is deliberately tangled — it contains both an empirical thread (a question evidence could answer) and a normative thread (a question about values). The pair&rsquo;s job is to pull the two threads apart and write each one out separately in the worksheet.</p>
<p><strong>Why this activity:</strong> the Briefing&rsquo;s core skill isn&rsquo;t labeling a claim as empirical or normative — it&rsquo;s recognizing when a single claim contains both threads tangled together and pulling them apart. That&rsquo;s the move the minimum wage example modeled. This activity tests whether students can do it on fresh claims, with a partner to think out loud with.</p>
<p><strong>Total time:</strong> 30s setup, 4–5 min pair work, 90s–2 min answer key reveal, 30s closing. ~7 min total.</p>`,

    callOnScripts: [
      {
        target: 'When a pair writes the same thing in both boxes',
        line: '"Is that a question evidence could answer, or a question about what we value?" — don\'t give them the answer.',
      },
      {
        target: 'When a pair writes a position instead of a question',
        line: '"That\'s your answer. What was the question you answered?"',
      },
      {
        target: 'When a pair asks "is our answer right?"',
        line: '"Does your empirical thread name a question evidence could settle? Does your normative thread name a question about values? If yes to both, you\'ve untangled it."',
      },
      {
        target: 'When a pair restates the claim as a question',
        line: '"That\'s the claim restated. What\'s the evidence question hiding inside it? What\'s the values question?"',
      },
      {
        target: 'When a pair finishes all 5 early',
        line: '"Go back to claim 1. What would the evidence look like? What would your normative case be?" — keeps them engaged without breaking the activity.',
      },
    ],

    closingScript: {
      label: 'After the answer key reveal — read aloud',
      lines: [
        '"Notice what just happened. Every one of these claims looked like one argument when you first read it. By the end, you could see it was actually two — and the two arguments need to be argued in different ways. Evidence for the empirical thread. Reasons and values for the normative thread.',
        '"When you watch a political argument from now on, listen for this. Most of the time, the two sides aren\'t disagreeing about the same thing. They\'re each pulling on a different thread and wondering why the other one won\'t let go."',
      ],
    },

    facilitationNotes: [
      {
        title: 'Don\'t grade pair answers out loud.',
        body: 'The activity isn\'t about getting it "right" — it\'s about practicing the move. The reveal lets students self-assess privately.',
      },
      {
        title: 'Walk the room.',
        body: 'Listen for two patterns: pairs writing the same thing in both boxes (they haven\'t pulled the threads apart yet), and pairs writing a position instead of a question. If you hear either, ask one question and move on. Don\'t hand them the answer.',
      },
      {
        title: 'If the room is struggling broadly, pause at 3 min.',
        body: 'Do claim 1 together on the board, then release pairs to finish the rest. Better to model the move once than to leave the whole room frustrated.',
      },
      {
        title: 'Watch for: restating the claim as a question.',
        body: '"Should we defund the police?" is the claim restated — it\'s not untangling. Push: "What\'s the evidence question hiding inside it? What\'s the values question?"',
      },
      {
        title: 'Watch for: putting a position in the answer box.',
        body: '"Police are necessary" / "Police cause harm" are positions, not questions. Push: "That\'s your answer. What was the question you answered?"',
      },
      {
        title: 'Watch for: empirical = "facts I agree with," normative = "opinions I don\'t."',
        body: 'Push back on this immediately. "Empirical isn\'t \'true\' and normative isn\'t \'opinion.\' Both can be argued well or badly. The difference is how you argue them."',
      },
      {
        title: 'The reveal is the lesson.',
        body: 'Don\'t ask pairs to share what they got first. Just walk through the answer key on the projector. Students compare against their own work in real time — that\'s where the learning happens.',
      },
      {
        title: 'Move briskly through the answer key.',
        body: 'You\'re not lecturing the answer. You\'re modeling the untangling so students see the move done cleanly. ~15 seconds per claim is right.',
      },
    ],
  },

  ledger: {
    intro: `<p>Every lesson closes with a Ledger entry — about 4 minutes. This is a <strong>Standard</strong> entry: a multiple-choice retrospective on a recent political argument (the tracked data point) and a short written response. The MC asks students to apply the empirical/normative lens to a real conversation in their own life. The written prompt asks them to reflect on what changed.</p>`,
  },
}