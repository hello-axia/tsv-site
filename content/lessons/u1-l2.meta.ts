// content/lessons/u1-l2.meta.ts
// Sidecar metadata for "The Six Tensions of American Politics" (Briefing).
// Prose lives in u1-l2.html. The activity is a custom three-scenario
// 1D slider on Liberty vs. Equality, advanced internally by the
// activity component itself (one activity_submissions row per student).

import type { LessonMeta } from '@/lib/lesson-meta-types'

// --- Local activity shape ---------------------------------------------------
// The student/teacher/broadcast components all import this type to render
// scenario labels, slider extremes, and value arguments from a single source.

export type U1L2Scenario = {
  key: 'scenario1' | 'scenario2' | 'scenario3'
  index: number                 // 1, 2, 3 — used in headings and progress UI
  title: string                 // "Scenario 1 — College admissions at a public university"
  prompt?: string               // optional 1-2 sentence setup before the slider
  libertyEnd: {
    label: string               // short label at the left end of the slider
    valueArgument: string       // longer argument, revealed after class places
  }
  equalityEnd: {
    label: string
    valueArgument: string
  }
}

export type U1L2ActivityData = {
  tension: 'Liberty vs. Equality'
  scenarios: U1L2Scenario[]
}

// --- The lesson's meta object ----------------------------------------------

export const meta: LessonMeta = {
  slug: 'u1-l2',

  briefingExpandables: {
    tensions: [
      { icon: '1', title: 'Liberty vs. Equality', body: 'Should the system protect people&rsquo;s freedom to act, or work to make outcomes fairer? Taxes, affirmative action, school funding, healthcare &mdash; this tension underlies all of them.' },
      { icon: '2', title: 'Liberty vs. Order', body: 'How much freedom do we give up for safety and stability? Surveillance laws, gun laws, drug policy, public health mandates, policing disputes &mdash; these are all variations of this tension.' },
      { icon: '3', title: 'Majority Rule vs. Minority Rights', body: 'Are there certain rights that are secured to the minority, even if the majority have decided in a fair vote? The Electoral College, religious exemptions, free speech protection on unpopular views, protection of immigrant rights &mdash; these tensions live here.' },
      { icon: '4', title: 'Individual vs. Community', body: 'Is the basic unit of politics the person, or the group they belong to? Mask mandates, zoning laws, gun rights, parental rights in schools &mdash; all of these ask whether your choice is yours, or do you also have responsibility for the people around you.' },
      { icon: '5', title: 'Centralized vs. Decentralized Power', body: 'Some policies sit at the national level, while others sit closer to home. Who decides? Federal government, state government, the school board? An example: abortion after Dobbs. The question is not &ldquo;what is the policy&rdquo; but &ldquo;who gets to set the policy?&rdquo;' },
      { icon: '6', title: 'Tradition vs. Progress', body: 'When do we keep what works, and when do we need to change it? Marriage laws, the Constitution, school curricula, the structure of the Senate &mdash; every reform debate has this tension nudged in it.' },
    ],
  },

  activity: {
    type: 'custom',
    label: 'Liberty vs. Equality — three scenarios',
    data: {
      tension: 'Liberty vs. Equality',
      scenarios: [
        {
          key: 'scenario1',
          index: 1,
          title: 'Scenario 1 — College admissions at a public university',
          libertyEnd: {
            label: 'Test scores and grades only',
            valueArgument:
              'Admissions should reward what a student has actually achieved, not the circumstances they were born into. The fairest system is one where every applicant is judged by the same measurable standard — anything else means the university is picking winners based on factors the student didn\'t earn either way.',
          },
          equalityEnd: {
            label: 'Consider income, school quality, background',
            valueArgument:
              'A 3.8 GPA at a school while earning supplementary income for the family and a 3.8 GPA at a prep school with private tutors are not the same achievement. Judging both by the same number pretends a level playing field exists when it doesn\'t — real fairness means seeing what a student did with what they had, not just what\'s on the transcript.',
          },
        },
        {
          key: 'scenario2',
          index: 2,
          title: 'Scenario 2 — Income tax',
          libertyEnd: {
            label: 'Flat tax — everyone pays the same percentage',
            valueArgument:
              'Treating people equally under the law means applying the same rule to everyone, regardless of what they earn. A doctor and a cashier should both owe their country the same share of what they make — anything else punishes success and lets the government decide how much of your work is yours to keep. If progressive tax is the standard, the incentive to work disappears when half of your income is taken by the government.',
          },
          equalityEnd: {
            label: 'Progressive tax — higher earners pay a higher percentage',
            valueArgument:
              'A flat percentage hits people very differently in practice — 15% of a $30,000 income is rent money for a month; 15% of $3,000,000 is hardly felt in day to day life. Real equality isn\'t treating everyone identically; it\'s making sure the tax system doesn\'t crush the people at the bottom while barely touching the people at the top.',
          },
        },
        {
          key: 'scenario3',
          index: 3,
          title: 'Scenario 3 — One-time wealth tax',
          prompt:
            'A startup founder has built a $50M company. The government proposes a one-time wealth tax on net worth above $10M to fund public schools.',
          libertyEnd: {
            label: 'No — she earned it',
            valueArgument:
              'Income tax takes a share of new money as it comes in; a wealth tax reaches into what someone has already paid taxes on and already legally owns. Once the government can take what you\'ve already saved or built, the line between earning something and the state letting you keep it disappears.',
          },
          equalityEnd: {
            label: 'Yes — concentrated wealth should partly return',
            valueArgument:
              'No one builds a $50M company alone — it depends on public roads, courts, an educated workforce, and a stable economy the rest of the country pays to maintain. When wealth concentrates at the very top while public schools deteriorate, asking the largest beneficiaries of the system to reinvest in it is fair.',
          },
        },
      ],
    } satisfies U1L2ActivityData,
  },

  ledger: {
    mcQuestion:
      'Across the three scenarios today, where do you sit overall on Liberty vs. Equality?',
    mcOptions: [
      { key: 'lib_strong', label: '1 — Strongly Liberty' },
      { key: 'lib',        label: '2 — Liberty' },
      { key: 'lib_lean',   label: '3 — Lean Liberty' },
      { key: 'middle',     label: '4 — Genuinely in the middle' },
      { key: 'eq_lean',    label: '5 — Lean Equality' },
      { key: 'eq',         label: '6 — Equality' },
      { key: 'eq_strong',  label: '7 — Strongly Equality' },
    ],
    writtenPrompt:
      'What\'s the strongest point on the side you didn\'t pick that makes the most sense to you?',
    unitCapability: 'thinking_reasoning',
    privacyTier: 1,
  },
}