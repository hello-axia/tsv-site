// content/lessons/u1-l6.teacher.ts
// Teacher notes for "The Phone Search" (Deliberation).
// Read by /lessons/u1-l6 prep view. Not used at runtime by the live session.

import type { LessonTeacherNotes } from '@/lib/lesson-meta-types'

export const teacherNotes: LessonTeacherNotes = {
  slug: 'u1-l6',
  summary:
    "The first Deliberation. Students put the last five lessons' tools to work on a live tradeoff: should schools be able to search a student's phone on reasonable suspicion? You count the class off 1-2 to assign sides (1 = Yes, 2 = No), so students argue a position they did not choose. They prep two arguments and a predicted rebuttal, then run a five-round structured debate built around echo rounds — each side has to restate the other's case before answering it. The point is not to win; it's to weigh Liberty vs. Order honestly.",
  estimatedMinutes: 50,

  activity: {
    guide: `<p>Count the class off 1-2. <strong>1s argue Yes</strong> (schools have this authority); <strong>2s argue No</strong> (they don't). Students argue the side they're assigned, not the side they believe — that separation is the whole point, and the Ledger captures their real view afterward.</p>
<p>Each student preps on their device: their assigned side, two arguments (claim → reason → evidence), and a predicted opposing argument with a response to it. Then you run the five rounds. The device shows each student their own prep for reference during the debate and tells them whose turn it is; the debate itself is spoken.</p>
<p><strong>The echo rounds (2 and 4) are the heart of this lesson.</strong> Before either side answers the other, they have to repeat the other side's arguments accurately, and the original side gets to correct them. This is steelmanning from l5 turned into a live verification step. If a side echoes a strawman, the correction is where the real learning happens. Don't rush rounds 2 and 4 to get to "the good part" — they <em>are</em> the good part.</p>
<p><strong>Phases (you advance them):</strong> Prep → Round 1 (Yes case) → Round 2 (No echoes) → Round 3 (No case) → Round 4 (Yes echoes) → Round 5 (Open) → Closing. The student device follows your pace; the projector shows the current round.</p>
<p><strong>Time:</strong> ~6–8 min prep, ~2–3 min per debate round, ~3 min closing. Around 25 min of activity on top of the briefing read.</p>`,

    callOnScripts: [
      {
        target: 'When a student treats it as a contest to win rather than a tradeoff to weigh',
        line: '"You\'re not here to beat the other side. You\'re here to find the strongest version of both sides and figure out where the real disagreement is. Winning the room isn\'t the assignment — understanding the tradeoff is."',
      },
      {
        target: 'When the echoing side restates a weakened version of the other side\'s argument',
        line: '"That\'s not what they said — that\'s the version that\'s easy to beat. Say it back the way they\'d say it. [To the original side:] Did they get it right?"',
      },
      {
        target: 'When a student argues their assigned side as if it\'s their genuine belief and gets heated',
        line: '"Remember you were assigned this side. You don\'t have to believe it to argue it well — and you\'ll tell us what you actually think in the Ledger. Keep it on the argument, not on you."',
      },
      {
        target: 'When someone leans entirely on "it\'s a privacy violation" or "safety comes first" with no reasoning',
        line: '"That\'s a conclusion, not an argument. Why? What\'s the reason, and what\'s the evidence? Give me the case, not the verdict."',
      },
      {
        target: 'When a student says their assigned side is indefensible',
        line: '"Both sides have Supreme Court precedent behind them — T.L.O. on one side, Riley on the other. If you can\'t find the case, you don\'t understand the question yet. Look at the background sheet again."',
      },
      {
        target: 'During open discussion, when it drifts to personal phone stories',
        line: '"Anecdotes are fine for a second, but bring it back to the tradeoff: who should have the authority, and on what standard? Reasonable suspicion, or probable cause?"',
      },
    ],

    closingScript: {
      label: 'After Round 5 — read aloud',
      lines: [
        '"Three questions before the Ledger. Where did both sides actually agree? You probably agreed more than the debate made it sound.',
        '"Where was the real disagreement — was it about the facts, or about which value wins when Liberty and Order collide? Those are different kinds of disagreement, and naming which one you\'re having is half the work.',
        '"And is there a verdict? Sometimes the honest answer is that the tension doesn\'t resolve — that both costs are real and you\'re choosing which one to bear. That\'s not a failure to decide. That\'s seeing the question clearly."',
      ],
    },

    facilitationNotes: [
      {
        title: 'Sides are assigned, not chosen — and that\'s deliberate.',
        body: 'The count-off forces students to build a case they may not believe (the l5 skill, now live). Because of that, the Ledger MC asks for their ACTUAL position independent of the side they argued. Don\'t let students "switch sides" mid-debate because they realize they disagree with their assignment — that\'s exactly the discomfort the lesson is designed to produce. They register their real view in the Ledger.',
      },
      {
        title: 'The crux most students miss: the standard, not the act.',
        body: 'The question isn\'t really "can schools ever search phones" — almost everyone agrees they can in a true emergency. The live disagreement is the STANDARD: reasonable suspicion (T.L.O.) versus probable cause (the Riley logic). If a debate is stalling, push both sides onto the standard. That\'s where the real tradeoff lives.',
      },
      {
        title: 'Watch for a different-question swap.',
        body: 'Students will drift from "should schools have authority to SEARCH phones" into "should phones be ALLOWED in school at all." Different question. Redirect: "Phones being allowed is a separate debate. This one assumes the phone is here — the question is whether the school can look inside it, and on what basis."',
      },
      {
        title: 'Don\'t grade the arguments.',
        body: 'A student who prepped a rough case and got corrected in the echo round did the lesson. A polished case argued by someone who never engaged the other side did it less well. The prep submissions are there so you can call on specific reasoning during the rounds, not to score.',
      },
      {
        title: 'Use the cockpit mirror to drive the rounds.',
        body: 'The cockpit shows every student\'s prep grouped by side. Before Round 1, skim the Yes group — if three students prepped the Parkland threat-assessment angle and one prepped the in loco parentis doctrine, you can sequence who presents to build a fuller case. Same for calling out a strong predicted-rebuttal during open discussion.',
      },
      {
        title: 'Uneven groups are fine.',
        body: 'An odd class size leaves one side with an extra student. No adjustment needed — the debate is whole-group by side, not paired. Unlike l5, there\'s no pairing to balance.',
      },
    ],
  },

  ledger: {
    intro: `<p>This Ledger does something the activity can't: it separates the student's real opinion from the side they were assigned. The MC is a five-point scale of their ACTUAL position on the phone-search question — strong yes through strong no, with a genuine midpoint, because "both sides have real weight" is a defensible landing spot on a Liberty vs. Order question, not a dodge. This is the longitudinal data point. The written prompt is where they name what moved — the argument that landed, the moment their own side looked weaker or stronger than they expected. Movement is the signal; a student whose position held but who now understands the other side did the lesson.</p>`,
  },
}