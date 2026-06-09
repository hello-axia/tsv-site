// content/lessons/u1-l4.meta.ts
// Sidecar metadata for "Spotting Your Own Bias" (Briefing).
// Prose lives in u1-l4.html. The activity is a side-pick + self-audit:
// students pick which argument they intuitively agree with, then audit
// their own side for strengths and weaknesses. Two-stage submission
// (side first, then audit). Teacher controls step advance and the
// final answer-key reveal.

import type { LessonMeta } from '@/lib/lesson-meta-types'

// --- Local activity shape ---------------------------------------------------

export type U1L4Argument = {
  side: 'A' | 'B'
  label: string   // short label, e.g. "Public college should be free"
  body: string    // the full argument paragraph
}

export type U1L4AnswerKeyEntry = {
  side: 'A' | 'B'
  strengths: { title: string; body: string }[]
  weaknesses: { title: string; body: string }[]
}

export type U1L4ActivityData = {
  workType: 'side_audit'
  prompt: string
  arguments: [U1L4Argument, U1L4Argument]
  answerKey: [U1L4AnswerKeyEntry, U1L4AnswerKeyEntry]
}

export const meta: LessonMeta = {
  slug: 'u1-l4',

  briefingExpandables: {
    harderToDefend: [
      { title: '"No previous generation could understand."', body: 'This statement is unfalsifiable. What it is doing is making any older person&rsquo;s view sound out of touch with the current situation.' },
      { title: '"Blaming social media is convenient."', body: 'Although it might be true, it does not engage with the evidence that social media might be harmful. It only asserts that it is convenient, but does not worry whether or not it is correct.' },
      { title: '"Some teenagers are months away from being adults."', body: 'By the same logic, 17-year-olds should also be able to drink, sign mortgages, or enlist in combat roles. The "almost 18" argument proves too much &mdash; it would erase every age line that protects minors, not just the social media one.' },
      { title: '"Politicians who don\'t use or understand the platform."', body: 'This is an attack on the people making the argument, not the argument itself. A politician who doesn\'t use TikTok or Instagram Reels can still be right about the effect it has on kids. And the inverse &mdash; a teenager who uses TikTok every day can still be wrong about what it\'s doing to her. Familiarity with something is not the same as understanding it.' },
    ],
  },

  framing: {
    activity: {
      flag: 'Audit your own side',
      title: 'Where does your argument get away with something?',
    },
  },

  activity: {
    type: 'custom',
    label: 'Pick a side, then audit it',
    data: {
      workType: 'side_audit',
      prompt:
        "Read both arguments. Pick the one you more intuitively agree with — don't overthink it. Once you've picked, your job is not to defend it. Your job is to find the places where, if you'd been reading the other side, you would have demanded evidence — but because you agreed, you smoothed it over.",
      arguments: [
        {
          side: 'A',
          label: 'Public college should be free',
          body:
            "Every student who can do the work should be able to attend public college without going into debt. We treat K–12 as a public good because we know an educated population is essential. But having a college diploma is the equivalent of what a high school one used to be. Having 22-year-olds deal with $50,000 in debt before they've earned a paycheck is cruel and economically nonsensical. Countries like Germany and Norway do this and their economies aren't collapsing. The only reason we don't is because we've been convinced that education is a private luxury rather than a public investment.",
        },
        {
          side: 'B',
          label: 'Public college should not be free',
          body:
            "Making public college free sounds generous, but it is actually a regressive policy. Students who choose to go to college are usually the ones from higher-income families, and they earn more over their lifetimes than people who don't go to college. Asking working-class taxpayers — many of whom have never completed college — to pay for future doctors and lawyers is a transfer of wealth in the wrong direction. If we want to help working people, we should fund trade schools, apprenticeships, and community colleges. Funding a four-year degree that most working-class Americans won't pursue out of their paychecks should not be worth considering. We already have Pell grants and need-based aid for students who can't afford tuition — what universal free college actually does is subsidize the middle and upper-middle class students who would have gone anyway.",
        },
      ],
      answerKey: [
        {
          side: 'A',
          strengths: [
            {
              title: 'The K–12 analogy is real.',
              body:
                'We do treat universal basic education as a public good, and the historical claim that a college degree now functions roughly the way a high school diploma used to has genuine economic backing — reflected in labor market data on credential requirements.',
            },
            {
              title: 'It names a real cost.',
              body:
                'Student debt is a documented drag on household formation, homeownership, and entrepreneurship. Anyone arguing against free college has to address what the debt actually does to young adults.',
            },
            {
              title: 'It frames the question as a values question, not just a budget question.',
              body:
                'Whether education is a "private luxury or public investment" is exactly the kind of normative question the previous lesson taught — and naming it openly is a strength.',
            },
          ],
          weaknesses: [
            {
              title: '"Cruel and economically nonsensical."',
              body:
                'This is emotional framing standing in for argument. "Cruel" is a value claim disguised as a fact, and "economically nonsensical" gets asserted without engaging the actual economic case against free college (which exists, whether you agree with it or not).',
            },
            {
              title: '"Germany and Norway do this and their economies aren\'t collapsing."',
              body:
                'A cherry-picked comparison that ignores structural differences: smaller populations, different tax bases, different higher-ed sectors, stricter academic tracking before university. The argument doesn\'t engage why those examples might or might not transfer.',
            },
            {
              title: '"We\'ve been convinced that education is a private luxury."',
              body:
                'An unfalsifiable claim about public opinion — there\'s no way to confirm or deny that "we\'ve been convinced" of anything. It also frames anyone who disagrees as having been manipulated, which shuts down the debate instead of engaging it.',
            },
            {
              title: 'It never addresses the regressive-policy critique.',
              body:
                'The strongest version of the opposing argument — that free college subsidizes higher earners — is just absent. A strong argument engages the best version of the opposition.',
            },
          ],
        },
        {
          side: 'B',
          strengths: [
            {
              title: 'The regressive-policy point is genuinely strong.',
              body:
                'College attendance does correlate with higher family income, and college graduates do earn more over their lifetimes. This is real data, not rhetoric.',
            },
            {
              title: 'It names targeted aid that already exists.',
              body:
                'Pell grants and need-based aid are real programs that already address the access problem the other side is worried about. This is a substantive policy point, not just opposition.',
            },
            {
              title: 'It points to trade schools and apprenticeships.',
              body:
                'This frames the argument as which education to fund, not whether to fund education — which is harder to dismiss than blanket opposition.',
            },
          ],
          weaknesses: [
            {
              title: '"Future doctors and lawyers."',
              body:
                'Cherry-picks the highest-earning college outcomes to make the wealth-transfer framing land. Most college graduates aren\'t doctors or lawyers — they\'re teachers, social workers, nurses, mid-level managers. The argument\'s emotional weight depends on picking the most sympathetic-to-its-case examples.',
            },
            {
              title: '"Students who choose to go to college are usually from higher-income families."',
              body:
                'True now, but the whole point of free college is to change who attends. The argument uses the current demographic pattern to argue against a policy designed to alter that pattern — which is circular.',
            },
            {
              title: '"A four-year degree that most working-class Americans won\'t pursue."',
              body:
                'Treats the current attendance pattern as fixed. Doesn\'t engage with why working-class students don\'t pursue four-year degrees — cost being a major factor in the data.',
            },
            {
              title: 'It assumes the policy can\'t be designed to address its own concerns.',
              body:
                'A means-tested free college policy, or one that caps benefits at certain income levels, would answer most of the regressive critique. The argument doesn\'t engage with that — it treats "free college" as a single monolithic proposal.',
            },
          ],
        },
      ],
    } satisfies U1L4ActivityData,
  },

  ledger: {
    mcQuestion:
      'Which argument did you intuitively agree with more before the audit?',
    mcOptions: [
      { key: 'side_a',   label: 'Public college should be free (Argument A)' },
      { key: 'side_b',   label: 'Public college should not be free (Argument B)' },
      { key: 'tied',     label: "I genuinely couldn't tell — they felt about even" },
    ],
    writtenPrompt:
      "Name one specific weak point in the argument you picked that on the first read you skimmed over. Why do you think that was?",
    unitCapability: 'thinking_reasoning',
    privacyTier: 1,
  },
}