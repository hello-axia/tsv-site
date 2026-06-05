// content/lessons/u1-l7.meta.ts
// Sidecar metadata for "Looking Back" — the Unit 1 capstone Reflection.
// Prose lives in u1-l7.html. There is NO interactive activity: this is a
// reflection. The "activity" step is a STATIC recap of the unit's four
// reasoning tools, each tied to the lesson where students practiced it.
// No activity_state, no phases, no submission — the recap is read-only across
// all three modes. The real output is the Ledger written entry.
//
// The activity step is relabeled via framing ("Look back" / "The four tools")
// so students don't see a misleading "Activity" header on a reflection.

import type { LessonMeta } from '@/lib/lesson-meta-types'

// --- Local activity shape (static recap, no runtime state) ------------------

export type U1L7Tool = {
  name: string          // short name, e.g. "Fact vs. value"
  fullName: string      // the full capability, e.g. "Distinguishing empirical claims from normative ones"
  practicedIn: string   // the lesson where they used it
  takeaway: string      // one line on what the tool is for, going forward
}

export type U1L7ActivityData = {
  workType: 'reflection'
  unitTitle: string
  capability: string
  tools: U1L7Tool[]
}

export const meta: LessonMeta = {
  slug: 'u1-l7',

  framing: {
    activity: {
      flag: 'Look back',
      title: 'The four tools you built',
    },
  },

  activity: {
    type: 'custom',
    label: 'Look back at the unit before you reflect',
    data: {
      workType: 'reflection',
      unitTitle: 'Thinking and Reasoning Foundations',
      capability:
        "Approach political questions with the right mental tools: tell fact from value, weigh a tradeoff without collapsing to one side, catch your own bias, and disagree with people well. This is the toolkit you carry into every unit after this one.",
      tools: [
        {
          name: 'Fact vs. value',
          fullName: 'Telling empirical claims apart from normative ones',
          practicedIn: 'Spot the Threads — untangling the empirical and normative threads in five real claims',
          takeaway:
            "Before you argue about an answer, figure out what kind of question it is. A disagreement about what's true is settled differently than a disagreement about what's right.",
        },
        {
          name: 'Weighing tradeoffs',
          fullName: 'Using the Six Tensions to hold two real goods in tension',
          practicedIn: 'The Liberty vs. Equality scenarios — placing yourself on a slider with no clean answer',
          takeaway:
            'Most hard political questions are not good versus evil. They are good versus good — liberty against order, the individual against the community — and the work is choosing which cost to bear, not pretending one side has none.',
        },
        {
          name: 'Recognizing your own bias',
          fullName: 'Auditing your own thinking before you trust it',
          practicedIn: 'Spotting Your Own Bias — running the audit on your own position',
          takeaway:
            "The bias you can name is the one you can correct for. The dangerous one is the one you mistake for plain common sense.",
        },
        {
          name: 'Disagreeing well',
          fullName: 'Building the other side honestly, then deliberating without trying to win',
          practicedIn: 'Steelman It and the phone-search deliberation — making the case you reject, then weighing it live',
          takeaway:
            "You don't understand a position until you can state it so well that someone who holds it nods. Anything less is arguing with a cartoon.",
        },
      ],
    } satisfies U1L7ActivityData,
  },

  ledger: {
    writtenPrompt:
      "This unit gave you four tools: telling fact from value, weighing tradeoffs with the Six Tensions, recognizing your own bias, and disagreeing well. What did you actually learn from these four — and where do you think you'll use them, in this class or outside it?",
    unitCapability: 'thinking_reasoning',
    privacyTier: 1,
  },
}