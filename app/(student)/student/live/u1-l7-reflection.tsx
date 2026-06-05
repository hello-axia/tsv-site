'use client'

import type { U1L7ActivityData, U1L7Tool } from '@/content/lessons/u1-l7.meta'

type Mode = 'student' | 'teacher' | 'broadcast'

type Props = {
  // These exist to match the shared dispatch call signature used by the other
  // custom lessons. A reflection has no runtime state, so they're unused.
  assignmentId?: string
  lessonId?: string
  profileId?: string
  data: U1L7ActivityData
  mode?: Mode
}

export default function U1L7ReflectionActivity({ data, mode = 'student' }: Props) {
  const big = mode === 'broadcast'

  return (
    <div style={containerStyle(big)}>
      <div style={capabilityCardStyle(big)}>
        <div style={capabilityFlagStyle(big)}>What this unit was for</div>
        <p style={capabilityTextStyle(big)}>{data.capability}</p>
      </div>

      <div style={toolsLabelStyle(big)}>The four tools</div>
      <div style={toolsGridStyle(big)}>
        {data.tools.map((tool, i) => (
          <ToolCard key={i} tool={tool} num={i + 1} big={big} />
        ))}
      </div>
    </div>
  )
}

function ToolCard({ tool, num, big }: { tool: U1L7Tool; num: number; big: boolean }) {
  return (
    <div style={toolCardStyle(big)}>
      <div style={toolHeadStyle(big)}>
        <span style={toolNumStyle(big)}>{num}</span>
        <div>
          <div style={toolNameStyle(big)}>{tool.name}</div>
          <div style={toolFullNameStyle(big)}>{tool.fullName}</div>
        </div>
      </div>
      <p style={toolTakeawayStyle(big)}>{tool.takeaway}</p>
      <div style={toolPracticedStyle(big)}>
        <span style={toolPracticedFlagStyle(big)}>You practiced this in</span>
        {tool.practicedIn}
      </div>
    </div>
  )
}

// ---------- Styles (functions of `big` so broadcast scales up) ----------

const containerStyle = (big: boolean): React.CSSProperties => ({
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  padding: big ? '2.5rem 3rem' : '2rem',
})

const capabilityCardStyle = (big: boolean): React.CSSProperties => ({
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderLeft: '3px solid var(--gold)',
  borderRadius: '0 10px 10px 0',
  padding: big ? '1.5rem 2rem' : '1.25rem 1.5rem',
  marginBottom: big ? '2.5rem' : '2rem',
})

const capabilityFlagStyle = (big: boolean): React.CSSProperties => ({
  fontSize: big ? '0.85rem' : '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  marginBottom: big ? '0.7rem' : '0.55rem',
})

const capabilityTextStyle = (big: boolean): React.CSSProperties => ({
  fontSize: big ? 'clamp(1.2rem, 1.7vw, 1.6rem)' : '1rem',
  color: 'var(--text)',
  lineHeight: 1.6,
  margin: 0,
})

const toolsLabelStyle = (big: boolean): React.CSSProperties => ({
  fontSize: big ? '0.95rem' : '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  marginBottom: big ? '1.25rem' : '1rem',
})

const toolsGridStyle = (big: boolean): React.CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: big ? '1fr 1fr' : '1fr',
  gap: big ? '1.5rem' : '1rem',
})

const toolCardStyle = (big: boolean): React.CSSProperties => ({
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: big ? '1.75rem 2rem' : '1.4rem 1.6rem',
})

const toolHeadStyle = (big: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: big ? '1.1rem' : '0.85rem',
  marginBottom: big ? '1rem' : '0.85rem',
})

const toolNumStyle = (big: boolean): React.CSSProperties => ({
  flexShrink: 0,
  fontFamily: 'var(--font-display)',
  fontSize: big ? '2rem' : '1.5rem',
  color: 'var(--gold)',
  lineHeight: 1,
  minWidth: big ? '2.2rem' : '1.8rem',
})

const toolNameStyle = (big: boolean): React.CSSProperties => ({
  fontFamily: 'var(--font-display)',
  fontSize: big ? 'clamp(1.3rem, 1.9vw, 1.7rem)' : '1.2rem',
  color: 'var(--text)',
  lineHeight: 1.2,
  marginBottom: '0.2rem',
})

const toolFullNameStyle = (big: boolean): React.CSSProperties => ({
  fontSize: big ? '1rem' : '0.82rem',
  color: 'var(--text-faint)',
  lineHeight: 1.4,
})

const toolTakeawayStyle = (big: boolean): React.CSSProperties => ({
  fontSize: big ? '1.1rem' : '0.93rem',
  color: 'var(--text)',
  lineHeight: 1.6,
  margin: big ? '0 0 1.25rem' : '0 0 1rem',
})

const toolPracticedStyle = (big: boolean): React.CSSProperties => ({
  fontSize: big ? '0.95rem' : '0.85rem',
  color: 'var(--text-dim)',
  lineHeight: 1.5,
  paddingTop: big ? '1rem' : '0.85rem',
  borderTop: '1px dashed var(--border)',
})

const toolPracticedFlagStyle = (big: boolean): React.CSSProperties => ({
  display: 'block',
  fontSize: big ? '0.72rem' : '0.66rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#2980b9',
  marginBottom: '0.35rem',
})