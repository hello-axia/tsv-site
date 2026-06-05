// content/lessons/u1-l4.teacher.ts
// Teacher notes for "Spotting Your Own Bias" (Briefing).
// Read by /lessons/u1-l4 prep view. Not used at runtime by the live session.

import type { LessonTeacherNotes } from '@/lib/lesson-meta-types'

export const teacherNotes: LessonTeacherNotes = {
  slug: 'u1-l4',
  summary:
    'Teach the move of suspecting what you already agree with by walking through a deliberately one-sided argument about social media restrictions. Then have students pick a side on a fresh question (free college), audit their own side for weaknesses, and share back what they found. The closing move is the answer-key reveal.',
  estimatedMinutes: 40,

  activity: {
    guide: `<p>Students read two short arguments on free public college and pick the one they intuitively agree with. The platform splits them into Side A and Side B groups. In their group, students audit their <em>own</em> side: what does the argument do well, and where does it smooth something over?</p>
<p><strong>Why this activity:</strong> the Briefing&rsquo;s move is suspecting what you already agree with. Critiquing the other side is easy — students do it without thinking. The real skill is turning that lens on your own intuition. By grouping students with their own side and asking them to find the weak points themselves, the activity forces the exact move the Briefing teaches. The peer dynamic helps: students see other people they agree with finding holes, which makes it socially safer to do it themselves.</p>
<p><strong>Total time:</strong> 1 min setup + side pick, 4 min group audit, 90s share-out, 90s answer-key reveal, 30s closing. ~8 min total.</p>
<p><strong>Phases (you advance them):</strong> Pick side → Audit → Share-out → Reveal key. The student device follows your pace.</p>`,

    callOnScripts: [
      {
        target: 'When a group only lists strengths',
        line: '"What would the other side jump on if they read this? Find the part you\'d push back on if you disagreed."',
      },
      {
        target: 'When a group only lists weaknesses',
        line: '"You\'re over-correcting. What\'s the part of this argument the other side actually has to take seriously?"',
      },
      {
        target: 'When a group is defending the argument instead of auditing it',
        line: '"You\'re not defending it right now — you\'re auditing it. Where does it get away with something?"',
      },
      {
        target: 'During share-out: when a group critiques the other side instead of their own',
        line: '"That\'s a critique of the other argument. What\'s a problem in your argument?"',
      },
      {
        target: 'During share-out: when a student finds a real weakness in their own side',
        line: '"That\'s the move. You found something in your own argument that you would have caught instantly if it were on the other side."',
      },
      {
        target: 'When a group goes silent because everyone agrees too strongly',
        line: '"If a 60-year-old conservative read this, what\'s the first thing they\'d object to?" — gives them permission to find holes without feeling like they\'re betraying their position.',
      },
    ],

    closingScript: {
      label: 'After the answer-key reveal — read aloud',
      lines: [
        '"Look at how much your own side lacked. You probably caught some of it in your group. You probably missed some of it too — and that\'s the point. The argument you agreed with had real strengths and real holes. Your bias didn\'t make the argument stronger; it just made you less likely to see the holes.',
        '"The goal isn\'t to stop agreeing with things. It\'s to agree the same way you\'d disagree — with your eyes open."',
      ],
    },

    facilitationNotes: [
      {
        title: 'Don\'t let groups debate each other.',
        body: 'This isn\'t a debate activity. If a Side B student starts critiquing Side A during share-out, redirect: "We\'re not arguing against the other side right now. We\'re auditing our own."',
      },
      {
        title: 'Don\'t grade the audits.',
        body: 'A group that found two real weak points did the activity. A group that found four mediocre ones didn\'t do it better. The point is to practice the move, not perform it well.',
      },
      {
        title: 'Watch for performative self-flagellation.',
        body: 'Some students will overcorrect and tear their own argument apart to look intellectually honest. That\'s not the move either. Push back: "You picked this side for a reason. What\'s the real strength here?" The activity requires holding both — strength and weakness — simultaneously.',
      },
      {
        title: 'If a class is heavily skewed.',
        body: 'You\'ll see the side-pick distribution on your cockpit before the audit phase begins. If the room is 90% Side A, make two or three smaller Side A groups when you cluster physically — and consider asking the Side B minority to share first so their voices don\'t get drowned out.',
      },
      {
        title: 'The reveal is the lesson.',
        body: 'Don\'t walk through the answer key line by line. Pull it up on the projector and let students compare against what their group found in real time. ~90 seconds is right. Don\'t ask which weak points they missed — let them notice privately.',
      },
      {
        title: 'Common group failure: listing the same point twice.',
        body: 'Push for variety — different types of weakness (emotional appeal, cherry-pick, unfalsifiable claim, missing counterargument).',
      },
      {
        title: 'Common group failure: critiquing the topic instead of the argument.',
        body: '"I don\'t think college should be free" isn\'t a weakness of Argument A — it\'s a disagreement with its conclusion. The weakness is how Argument A makes its case, not whether the conclusion is right.',
      },
      {
        title: 'Common group failure: treating "things I\'d add" as weaknesses.',
        body: '"It should have mentioned student loan interest rates" isn\'t a weak point — it\'s a feature request. A real weakness is something the argument does badly, not something it leaves out.',
      },
    ],
  },

  ledger: {
    intro: `<p>Every lesson closes with a Ledger entry — about 4 minutes. The MC asks students to mark which side they intuitively agreed with before the audit (a tracked data point). The written prompt asks them to name a specific weak point they skimmed over on the first read — and why they think that was. This forces the lesson&rsquo;s move into a moment of private reflection.</p>`,
  },
}