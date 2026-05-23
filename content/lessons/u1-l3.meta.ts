// content/lessons/u1-l3.meta.ts
// Sidecar metadata for "Empirical vs. Normative" (Briefing).
// Prose lives in u1-l3.html. The activity is a pair-based digital worksheet:
// 5 political claims, each with an empirical and normative text field.
// Teacher reveals an answer key when ready; activity_state holds { revealed: bool }.

import type { LessonMeta } from '@/lib/lesson-meta-types'

// --- Local activity shape ---------------------------------------------------

export type U1L3Claim = {
  key: 'claim1' | 'claim2' | 'claim3' | 'claim4' | 'claim5'
  index: number               // 1..5
  claim: string               // the political claim itself
  answerKey: {
    empirical: string         // model answer for the empirical thread
    normative: string         // model answer for the normative thread
  }
}

export type U1L3ActivityData = {
  workType: 'pair_worksheet'
  claims: U1L3Claim[]
}

export const meta: LessonMeta = {
    slug: 'u1-l3',
  
    framing: {
      activity: {
        flag: 'Spot the threads',
        title: 'Can you untangle the claim?',
      },
    },
  
    activity: {
    type: 'custom',
    label: 'Untangle the threads — 5 political claims',
    data: {
      workType: 'pair_worksheet',
      claims: [
        {
          key: 'claim1',
          index: 1,
          claim: 'We should defund the police.',
          answerKey: {
            empirical:
              'Does reducing police funding — and redirecting it to social services, mental health response, or community programs — reduce or increase crime? Does it improve outcomes in the communities most affected by policing?',
            normative:
              'What is the role of policing in a just society? Should public safety be handled primarily through armed enforcement, or through other institutions? What do we owe to communities that have been over-policed, and what do we owe to those who depend on police for protection?',
          },
        },
        {
          key: 'claim2',
          index: 2,
          claim: 'College should be free.',
          answerKey: {
            empirical:
              'If college were tuition-free, would more students enroll, graduate, and earn higher incomes? Who would actually benefit — and would the cost to taxpayers produce a net gain or loss for the economy?',
            normative:
              'Is higher education a public good (like K–12) or a private investment in oneself? Should taxpayers fund the education of people who will likely earn more than them as a result? Does access to college matter as a question of fairness, regardless of cost?',
          },
        },
        {
          key: 'claim3',
          index: 3,
          claim: 'The voting age should be lowered to 16.',
          answerKey: {
            empirical:
              'Are 16-year-olds civically informed and cognitively developed enough to vote responsibly? In places that have lowered the voting age (parts of Europe, some U.S. localities), did turnout, civic engagement, or election outcomes change?',
            normative:
              'At what age does a person earn the right to shape decisions that affect them? If 16-year-olds can work, pay taxes, and be tried as adults in some cases, does it follow that they should vote? Or does voting require a maturity threshold that distinguishes it from other rights?',
          },
        },
        {
          key: 'claim4',
          index: 4,
          claim: 'Social media companies should be required to verify user ages.',
          answerKey: {
            empirical:
              'Does social media use measurably harm teenagers — mental health, attention, sleep, social development? Would age verification actually reduce that harm, or would teens find workarounds? What are the privacy costs of requiring ID uploads from every user?',
            normative:
              'Is protecting minors from harm a strong enough reason to require every adult to surrender anonymity online? Where does parental responsibility end and government regulation begin? Is online anonymity a right worth protecting, or a loophole that enables harm?',
          },
        },
        {
          key: 'claim5',
          index: 5,
          claim: 'The U.S. should accept more refugees.',
          answerKey: {
            empirical:
              'What is the economic impact of refugee resettlement — on wages, public services, crime rates, and long-term GDP? How do refugees fare over time, and how do receiving communities fare?',
            normative:
              'What does the U.S. owe to people fleeing persecution, especially from conflicts the U.S. has been involved in? Do obligations to citizens come before obligations to non-citizens? Is national identity defined by who we let in, or by who is already here?',
          },
        },
      ],
    } satisfies U1L3ActivityData,
  },

  ledger: {
    mcQuestion:
      'Think about the last political argument you saw or had — at home, online, with friends. Looking back, was it actually one argument, or two tangled together?',
    mcOptions: [
      { key: 'one_empirical', label: 'One clean argument — mostly empirical' },
      { key: 'one_normative', label: 'One clean argument — mostly normative' },
      { key: 'two_tangled',   label: 'Two tangled together' },
      { key: 'cant_tell',     label: 'I can\'t tell' },
    ],
    writtenPrompt:
      'What was the argument, and what do you think now that you\'ve learned this move?',
    unitCapability: 'thinking_reasoning',
    privacyTier: 1,
  },
}