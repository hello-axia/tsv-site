// content/lessons/u1-l5.meta.ts
// Sidecar metadata for "Steelmanning" (Briefing).
// Prose lives in u1-l5.html. The activity asks students to pick a side on a
// federal-vs-state immigration authority question, then write the strongest
// possible argument for the OPPOSITE side. Verbal pair-trade with someone
// who picked the other side. Two-stage submission (side first, then steelman).
// Teacher controls phase advance.

import type { LessonMeta } from '@/lib/lesson-meta-types'

// --- Local activity shape ---------------------------------------------------

export type U1L5Side = 'federal' | 'state'

export type U1L5Case = {
  side: U1L5Side
  label: string   // "The Case for Federal Authority"
  body: string    // full case text (multi-paragraph, plain text with \n\n separators)
}

export type U1L5ActivityData = {
  workType: 'steelman'
  tension: string              // Six Tensions label
  pollQuestion: string
  pollOptions: { side: U1L5Side; label: string }[]
  cases: [U1L5Case, U1L5Case]
  pairSharePrompts: string[]
}

export const meta: LessonMeta = {
  slug: 'u1-l5',

  framing: {
    activity: {
      flag: 'Steelman it',
      title: "Can you build the case you don't believe?",
    },
  },

  activity: {
    type: 'custom',
    label: 'Build the strongest case against your own view',
    data: {
      workType: 'steelman',
      tension: 'Centralized vs. Decentralized Power',
      pollQuestion:
        'Should states have meaningful authority to set their own immigration enforcement policies, or should immigration enforcement be the sole authority of the federal government? This question is not about whether immigration should be restricted or expanded — it is about who decides.',
      pollOptions: [
        { side: 'federal', label: 'The federal government' },
        { side: 'state',   label: 'The state governments' },
      ],
      cases: [
        {
          side: 'state',
          label: 'The Case for State Authority',
          body:
            "States vary enormously. Texas shares a 1,254-mile border with Mexico; most other states do not. California has roughly 10.5 million foreign-born residents; Wyoming has around 22,000. The immigration conditions a state faces are not the same in any two places.\n\n" +
            "The federal government is one institution, but it is making policy for all 50 states. State governments are closer to the actual people affected. A county sheriff in Arizona knows which routes are being used by smugglers this month while ICE headquarters in Washington does not. A hospital in Texas knows how many undocumented immigrant patients it is absorbing and how it is affecting emergency rooms. A school district in Florida knows how many students arrive mid-year speaking only Spanish or Haitian Creole, and whether it has teachers to handle them. Federal agencies do not have this information at the speed or granularity that decisions require. States often do.\n\n" +
            "There is also a historical argument. Congress has not passed major immigration reform since 1986. In the absence of federal action, states have moved on their own, and in opposite directions. Texas began constructing its own border barriers in 2021 when federal construction stopped. California, Illinois, and others have passed sanctuary policies because they considered federal enforcement too aggressive. When the federal government fails to act, the states need to address their own problems.\n\n" +
            "A final argument: the Tenth Amendment reserves to the states all powers the Constitution does not specifically give to the federal government. When federal power expands into immigration, the structure of the American government changes. When the federal government sets one immigration policy for 330 million Americans, the people who disagree with it have nowhere to go. When 50 states set 50 policies, citizens have real choice — they can live under the policy they agree with, hold their state accountable directly through state elections, and watch how different approaches play out in different states. Decentralized power allows the country to test ideas at the state level before imposing one approach on everyone. States having autonomy is a check on centralized power; the federal government imposing laws on the states may be an overreach.",
        },
        {
          side: 'federal',
          label: 'The Case for Federal Authority',
          body:
            "Immigration, by nature, is a national question. The border between the United States and Mexico is not California's border or Texas's border — it is the country's border. Whether someone enters on a plane in Montana or on a boat in Florida, they are affecting the entire country. If all 50 states can determine what it means to be legally in the country, there is no longer one system, but a patchwork of 50 trying to settle on one cohesive standard. The Supreme Court has made it clear: immigration is a federal power, established in Article I of the Constitution.\n\n" +
            "There is also a historical argument. When states have tried to write their own immigration enforcement law, the consequences have been concrete. Arizona passed a law in 2010 that required local police to check the immigration status of anyone they stopped if there was \"reasonable suspicion.\" In practice, the law led U.S. citizens of Latino descent to be detained based on appearance, and the state lost an estimated $140 million to boycotts. The Supreme Court struck down most of the law in Arizona v. United States (2012). This is evidence that state-level immigration enforcement can produce concrete harm.\n\n" +
            "There is also a practical argument. If states set their own enforcement policies, the inconsistencies create real harm. Local police might have the right to detain in one state, but if they cross into another, they may be breaking state law. Employers operating in multiple states would face fifty different verification rules — inconsistent hiring standards that block out individuals who have the right to work. The result would be chaos if every law enforcement officer and employer had to navigate fifty conflicting frameworks.\n\n" +
            "The flipside is immigrants having varied rights based entirely on where they happen to be. Detention, deportation, and the separation of families may result if the protections any individual receives are dependent entirely on the state they end up in. If an individual believed they had the right to be in the country but ends up arrested after crossing a state border without due process, the country fails to be one cohesive unit. A federal framework can ensure equal treatment for all, regardless of geography.",
        },
      ],
      pairSharePrompts: [
        'What did your partner get right about your view?',
        "What did they miss?",
        "What part of your actual view did they not capture? Is there anything that makes your own view stronger than they made it sound?",
      ],
    } satisfies U1L5ActivityData,
  },

  ledger: {
    mcQuestion:
      "After steelmanning the other side and hearing your partner's feedback, where do you stand on the question now?",
    mcOptions: [
      { key: 'firmly_original',   label: 'Still firmly with my original side' },
      { key: 'softened_original', label: 'Still with my original side, but I see the other case better now' },
      { key: 'torn',              label: 'Genuinely torn — the other side has more to it than I thought' },
      { key: 'shifted',           label: 'Shifted toward the other side' },
    ],
    writtenPrompt:
      "What is one thing about your own position you understand better after writing the other side's case?",
    unitCapability: 'thinking_reasoning',
    privacyTier: 1,
  },
}