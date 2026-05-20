// lib/curriculum.ts
// Single source of truth for the TSV curriculum structure.
// Content (the prose, activity HTML, facilitation notes) lives in
// content/lessons/{slug}.html and content/lessons/{slug}.meta.ts (if applicable).

export type LessonType =
  | 'briefing'
  | 'artifact_analysis'
  | 'deliberation'
  | 'civic_action'
  | 'reflection'
  | 'reflection_sharing'

export type LessonEntry = {
  slug: string
  unit: number
  lessonNumber: number
  title: string
  type: LessonType
  status: 'draft' | 'published'
}

export type UnitEntry = {
  unit: number
  title: string
  lessons: LessonEntry[]
}

export const CURRICULUM: UnitEntry[] = [
  {
    unit: 1,
    title: 'Thinking and Reasoning Foundations',
    lessons: [
      { slug: 'u1-l1', unit: 1, lessonNumber: 1, title: 'The Cost of Sitting Out',         type: 'briefing',           status: 'draft' },
      { slug: 'u1-l2', unit: 1, lessonNumber: 2, title: 'The Six Tensions of American Politics', type: 'briefing',     status: 'draft' },
      { slug: 'u1-l3', unit: 1, lessonNumber: 3, title: 'Empirical vs. Normative',         type: 'briefing',           status: 'draft' },
      { slug: 'u1-l4', unit: 1, lessonNumber: 4, title: 'Spotting your Own Bias',          type: 'artifact_analysis',  status: 'draft' },
      { slug: 'u1-l5', unit: 1, lessonNumber: 5, title: 'Steelmanning Practice',           type: 'deliberation',       status: 'draft' },
      { slug: 'u1-l6', unit: 1, lessonNumber: 6, title: 'Tradeoff Question',               type: 'deliberation',       status: 'draft' },
      { slug: 'u1-l7', unit: 1, lessonNumber: 7, title: 'Reflection Sharing',              type: 'reflection_sharing', status: 'draft' },
    ],
  },
  {
    unit: 2,
    title: 'Government Foundations',
    lessons: [
      { slug: 'u2-l1', unit: 2, lessonNumber: 1, title: 'The Anatomy of an Executive Order', type: 'artifact_analysis', status: 'draft' },
      { slug: 'u2-l2', unit: 2, lessonNumber: 2, title: 'How a Bill Actually Becomes a Law', type: 'artifact_analysis', status: 'draft' },
      { slug: 'u2-l3', unit: 2, lessonNumber: 3, title: 'Reading a Court Ruling',            type: 'artifact_analysis', status: 'draft' },
      { slug: 'u2-l4', unit: 2, lessonNumber: 4, title: 'The State and Local Government',    type: 'briefing',           status: 'draft' },
      { slug: 'u2-l5', unit: 2, lessonNumber: 5, title: 'Map your Government',               type: 'civic_action',       status: 'draft' },
      { slug: 'u2-l6', unit: 2, lessonNumber: 6, title: 'Reflection Sharing',                type: 'reflection_sharing', status: 'draft' },
    ],
  },
  {
    unit: 3,
    title: 'Information Literacy',
    lessons: [
      { slug: 'u3-l1', unit: 3, lessonNumber: 1, title: 'The Information Environment',     type: 'briefing',           status: 'draft' },
      { slug: 'u3-l2', unit: 3, lessonNumber: 2, title: 'News at a Glance',                type: 'artifact_analysis',  status: 'draft' },
      { slug: 'u3-l3', unit: 3, lessonNumber: 3, title: 'The Algorithm and Rage Bait',     type: 'artifact_analysis',  status: 'draft' },
      { slug: 'u3-l4', unit: 3, lessonNumber: 4, title: 'How to Actually Read Good News',  type: 'briefing',           status: 'draft' },
      { slug: 'u3-l5', unit: 3, lessonNumber: 5, title: 'Conspiracy Theories',             type: 'artifact_analysis',  status: 'draft' },
      { slug: 'u3-l6', unit: 3, lessonNumber: 6, title: 'Social Media',                    type: 'deliberation',       status: 'draft' },
      { slug: 'u3-l7', unit: 3, lessonNumber: 7, title: 'Reflection Sharing',              type: 'reflection_sharing', status: 'draft' },
    ],
  },
  {
    unit: 4,
    title: 'Personal Politics',
    lessons: [
      { slug: 'u4-l1', unit: 4, lessonNumber: 1, title: 'Belief Genealogy',                            type: 'reflection',         status: 'draft' },
      { slug: 'u4-l2', unit: 4, lessonNumber: 2, title: 'A Guide on how to Form Political Opinions',   type: 'briefing',           status: 'draft' },
      { slug: 'u4-l3', unit: 4, lessonNumber: 3, title: 'How to have Controversial Conversations',     type: 'briefing',           status: 'draft' },
      { slug: 'u4-l4', unit: 4, lessonNumber: 4, title: 'Disagreement',                                type: 'deliberation',       status: 'draft' },
      { slug: 'u4-l5', unit: 4, lessonNumber: 5, title: 'Hot Topic',                                   type: 'deliberation',       status: 'draft' },
      { slug: 'u4-l6', unit: 4, lessonNumber: 6, title: 'Reflection Sharing',                          type: 'reflection_sharing', status: 'draft' },
    ],
  },
  {
    unit: 5,
    title: 'Doing Democracy',
    lessons: [
      { slug: 'u5-l1', unit: 5, lessonNumber: 1, title: 'Why Down-Ballot Matters',                      type: 'briefing',           status: 'draft' },
      { slug: 'u5-l2', unit: 5, lessonNumber: 2, title: 'Build a Candidate Brief',                      type: 'civic_action',       status: 'draft' },
      { slug: 'u5-l3', unit: 5, lessonNumber: 3, title: 'Decide a Ballot',                              type: 'civic_action',       status: 'draft' },
      { slug: 'u5-l4', unit: 5, lessonNumber: 4, title: 'Debate the Ballot',                            type: 'deliberation',       status: 'draft' },
      { slug: 'u5-l5', unit: 5, lessonNumber: 5, title: 'Beyond the Ballot: Other Ways to Participate', type: 'briefing',           status: 'draft' },
      { slug: 'u5-l6', unit: 5, lessonNumber: 6, title: 'Reflection Sharing',                           type: 'reflection_sharing', status: 'draft' },
    ],
  },
]

// Flat lookup helper — used by lesson detail pages and the seed script.
export const LESSON_BY_SLUG: Record<string, LessonEntry> =
  Object.fromEntries(
    CURRICULUM.flatMap(u => u.lessons.map(l => [l.slug, l]))
  )

// Total lesson count, exposed for the homepage stat strip and similar.
export const LESSON_COUNT = CURRICULUM.reduce(
  (acc, u) => acc + u.lessons.length,
  0,
)