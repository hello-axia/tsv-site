// content/lessons/u1-l5.teacher.ts
// Teacher notes for "Steelmanning" (Briefing).
// Read by /lessons/u1-l5 prep view. Not used at runtime by the live session.

import type { LessonTeacherNotes } from '@/lib/lesson-meta-types'

export const teacherNotes: LessonTeacherNotes = {
  slug: 'u1-l5',
  summary:
    "Teach steelmanning — building the strongest possible version of an argument you reject — through a federal-vs-state immigration authority question. Students pick a side, then write the strongest case for the opposite side. They pair up with someone who picked the side they argued for and trade feedback. The move: you don't know what you believe until you can accurately say what you disagree with.",
  estimatedMinutes: 45,

  activity: {
    guide: `<p>Students vote on whether immigration enforcement should be primarily a federal or state responsibility. Then they read the case for the side they <em>didn't</em> pick and write the strongest possible version of that argument. Finally, they pair up with someone who picked the side they argued for — meaning their partner is reading their own view back to them, written by someone who disagrees.</p>
<p><strong>Why this activity:</strong> the only way to know if you understand the other side is to make their case to someone who actually holds it. If your partner reads what you wrote and says "yeah, that's it" — you understood. If they say "you missed the most important part" — you were probably strawmanning. The pair trade isn't decoration; it's the verification step that makes the steelman real.</p>
<p><strong>Total time:</strong> 1 min pick side, 6–8 min read + write, 3–4 min pair share, 1 min closing. ~12–14 min activity.</p>
<p><strong>Phases (you advance them):</strong> Pick side → Read &amp; write → Pair share → Closing. The student device follows your pace.</p>
<p><strong>Pairing is verbal/physical.</strong> The platform does not assign pairs. After the writing phase ends, you tell students to find a partner who picked the side they wrote for. If the class is heavily skewed (e.g. 22 federal / 6 state), the minority side will need to be shared across multiple pairs — that's fine; ask them to read multiple federal-side steelmans, one at a time. If the split is dead even, simplest pairing is "find anyone wearing a different color shirt who picked the other side."</p>`,

    callOnScripts: [
      {
        target: 'When a student picks their side and immediately wants to argue why they\'re right',
        line: '"You\'re not arguing for your side today. You\'re arguing for the side you didn\'t pick. The point is to make their case so well that someone who actually holds it would agree with what you wrote."',
      },
      {
        target: 'When a student writes a weak version of the other side ("the other side just thinks...")',
        line: '"That\'s a strawman. Would someone who actually holds this view recognize themselves in what you wrote? If not, keep working."',
      },
      {
        target: 'When a student says "I can\'t make their case because they\'re wrong"',
        line: '"That\'s why this is the assignment. You don\'t have to believe it. You have to be able to write it so well that they would believe a teammate wrote it."',
      },
      {
        target: 'During pair share: when a partner says "yeah, that\'s basically right"',
        line: '"Good — that\'s a real steelman. Now tell them what they missed. Even a strong version usually leaves something out."',
      },
      {
        target: 'During pair share: when a partner says "no, you missed the whole point"',
        line: '"That\'s the most valuable feedback in this lesson. Tell them what the actual point is — that\'s the thing they were arguing against without knowing."',
      },
      {
        target: 'When a student says "well I changed my mind"',
        line: '"That happens, and it\'s allowed. But notice: it took you having to make their case before you could see it. That\'s the move."',
      },
    ],

    closingScript: {
      label: 'After pair share — read aloud',
      lines: [
        '"The goal of this lesson wasn\'t to change your mind. Some of you might have shifted. Most of you probably didn\'t. That\'s not the point.',
        '"The point is this: you now know what the other side actually believes — because you had to write it, and someone who holds that view checked your work. The next time you encounter this question outside this room, you\'ll be arguing against the real position, not a cartoon of it.',
        '"That\'s the difference between debate and noise. Strawmanning is noise. Steelmanning is debate."',
      ],
    },

    facilitationNotes: [
      {
        title: 'The framing matters: "who decides," not "what should the policy be."',
        body: 'Students will want to drift into "should we have more or less immigration?" If they do, redirect: "That\'s a different question. This question is about which level of government holds the authority. A person who wants stricter enforcement can favor federal OR state. A person who wants more open immigration can favor federal OR state. Stay on who decides."',
      },
      {
        title: "Don't grade the steelmans.",
        body: 'A student who wrote a weak steelman and got real feedback from a partner who corrected them did the activity. A student who wrote a polished steelman in isolation didn\'t do it better — they just had a head start.',
      },
      {
        title: 'Watch for: writing FOR their own side disguised as steelmanning.',
        body: '"The state side would say X, but actually that\'s wrong because Y" is not steelmanning. It\'s argument with a costume. Push back: "Drop the \'but actually.\' Write the X without the Y. If you find yourself adding a Y, you\'re still on your own side."',
      },
      {
        title: 'Watch for: surface-level mimicry without grasping the actual case.',
        body: 'A student might list three talking points they\'ve heard from that side without understanding why those points work together. Push: "If your partner asked you why this argument matters to someone who believes it, what would you say?" Then have them write that into the steelman.',
      },
      {
        title: 'Heavy skew handling.',
        body: 'If 80%+ of the class picks one side, the minority will be overwhelmed in pair share. Two adjustments: (a) Have the minority students read aloud first to the whole class — their steelmans of the majority position are useful for everyone. (b) Group pair share — three majority students share with one minority student rather than 1:1.',
      },
      {
        title: 'The discussion prompts during pair share are sequenced.',
        body: '"What did they get right" first — affirms before critiques. "What did they miss" second — the substantive correction. "What\'s missing from your actual view" third — this is where the real learning happens, when the steelman writer hears what the actual believer cares most about that they didn\'t capture.',
      },
      {
        title: "Don't let pair share become debate.",
        body: 'The original side-holder is giving feedback on the steelman, not arguing for their position. If you hear "well I think state authority is actually right because…" redirect: "You\'re not arguing your view right now — you\'re telling them what they got right or missed about your view. That\'s the assignment."',
      },
    ],
  },

  ledger: {
    intro: `<p>Every lesson closes with a Ledger entry — about 4 minutes. The MC tracks movement after steelmanning: did the activity move you, soften you, leave you torn, or shift you fully? This is a deliberately granular question — most students will land in "softened" or "torn," which are both successful outcomes for the lesson. The written prompt forces the student to articulate what they learned about their own position by having to make the opposing case. That self-knowledge is the actual point of steelmanning.</p>`,
  },
}