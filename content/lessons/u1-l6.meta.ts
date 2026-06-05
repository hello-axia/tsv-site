// content/lessons/u1-l6.meta.ts
// Sidecar metadata for "The Phone Search" — the first Deliberation.
// Prose lives in u1-l6.html. The activity: teacher counts the class off 1-2,
// assigning sides (1 = Yes, 2 = No). Each student records their assigned side
// and prepares two arguments (claim/reason/evidence) plus a predicted opposing
// rebuttal and a response to it. ONE-SHOT submission (no two-stage). The debate
// itself is verbal — the platform drives the round choreography and shows each
// student their own prep for reference. Teacher controls phase advance.
//
// Sides are ASSIGNED by count-off, not chosen — so the ledger MC captures the
// student's ACTUAL position on the question (independent of the side they
// argued), and the written prompt captures what moved.

import type { LessonMeta } from '@/lib/lesson-meta-types'

// --- Local activity shapes --------------------------------------------------

export type U1L6Side = 'yes' | 'no'

// The five verbal debate rounds, in order. Prep and Closing bracket these but
// aren't "rounds" — they're separate phases in the component's ActivityStep.
export type U1L6DebateStep = 'yes_case' | 'no_echo' | 'no_case' | 'yes_echo' | 'open'

export type U1L6Round = {
  step: U1L6DebateStep
  label: string         // short pill label, e.g. "No echoes"
  headline: string      // big broadcast line, e.g. "Round 2 — NO repeats YES"
  instruction: string   // what the room should be doing
  activeSide: U1L6Side | 'both'
}

export type U1L6ActivityData = {
  workType: 'deliberation'
  tension: string
  question: string
  sideLabels: { yes: string; no: string }
  rounds: U1L6Round[]          // exactly the 5 verbal rounds, in order
  closingQuestions: string[]
}

// --- Student submission shape (one-shot prep) -------------------------------

export type U1L6Argument = {
  claim: string
  reason: string
  evidence: string
}

export type U1L6PrepData = {
  assignedSide: U1L6Side       // self-reported from the count-off
  arguments: [U1L6Argument, U1L6Argument]
  rebuttal: {
    predictedOpposing: string  // what they expect the other side to argue
    response: string           // how they'd answer it
  }
  submittedAt: string
}

export const meta: LessonMeta = {
  slug: 'u1-l6',

  framing: {
    activity: {
      flag: 'Deliberate',
      title: 'Can you argue it without trying to win?',
    },
  },

  activity: {
    type: 'custom',
    label: 'Prepare your side, then deliberate the tradeoff',
    data: {
      workType: 'deliberation',
      tension: 'Liberty vs. Order',
      question:
        "Should public schools have the authority to search a student's phone when they suspect a school rule has been broken?",
      sideLabels: {
        yes: 'Schools should have this authority',
        no: 'Schools should not have this authority',
      },
      rounds: [
        {
          step: 'yes_case',
          label: 'Yes case',
          headline: 'Round 1 — YES presents',
          instruction:
            'The YES side presents their two strongest arguments. The NO side listens — you repeat these back next round, so listen for the real point, not a version you can knock down.',
          activeSide: 'yes',
        },
        {
          step: 'no_echo',
          label: 'No echoes',
          headline: 'Round 2 — NO repeats YES',
          instruction:
            "The NO side restates the YES side's arguments in their own words. The YES side then corrects anything the NO side missed or softened.",
          activeSide: 'no',
        },
        {
          step: 'no_case',
          label: 'No case',
          headline: 'Round 3 — NO presents',
          instruction:
            'The NO side presents their two strongest arguments. The YES side listens — you repeat these back next round.',
          activeSide: 'no',
        },
        {
          step: 'yes_echo',
          label: 'Yes echoes',
          headline: 'Round 4 — YES repeats NO',
          instruction:
            "The YES side restates the NO side's arguments in their own words. The NO side then corrects anything the YES side missed or softened.",
          activeSide: 'yes',
        },
        {
          step: 'open',
          label: 'Open',
          headline: 'Round 5 — Open discussion',
          instruction:
            'Open floor. Press where an argument is weak, concede where the other side has a real point. The goal is to weigh the tradeoff honestly, not to win.',
          activeSide: 'both',
        },
      ],
      closingQuestions: [
        'Where did both sides actually agree?',
        'Where was the real disagreement — and was it about facts, or about values?',
        'Is there a final verdict, or is the tension itself the honest answer?',
      ],
    } satisfies U1L6ActivityData,
  },

  ledger: {
    mcQuestion:
      'Set the debate aside. Where do YOU actually land on the question — regardless of the side you were assigned to argue?',
    mcOptions: [
      { key: 'strongly_yes', label: 'Strongly yes — schools should have this authority' },
      { key: 'lean_yes',     label: 'Lean yes' },
      { key: 'uncertain',    label: 'Genuinely uncertain — I see real weight on both sides' },
      { key: 'lean_no',      label: 'Lean no' },
      { key: 'strongly_no',  label: 'Strongly no — schools should not have this authority' },
    ],
    writtenPrompt:
      'What in the debate resonated with you most — your biggest "aha" moment? Write about what shifted or sharpened your view, even if your overall position stayed the same.',
    unitCapability: 'thinking_reasoning',
    privacyTier: 1,
  },
}