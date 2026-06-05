'use client'

import type { LessonMeta } from '@/lib/lesson-meta-types'
import type { U1L2ActivityData } from '@/content/lessons/u1-l2.meta'
import type { U1L3ActivityData } from '@/content/lessons/u1-l3.meta'
import type { U1L4ActivityData } from '@/content/lessons/u1-l4.meta'
import type { U1L5ActivityData, U1L5Side } from '@/content/lessons/u1-l5.meta'
import type { U1L6ActivityData, U1L6Side } from '@/content/lessons/u1-l6.meta'

// The archive passes the raw stored `data` jsonb plus the lesson meta.
// We render each lesson's own shape back to the student. Unknown/missing
// shapes fall through to a generic readout so nothing ever blanks out.

type Props = {
  slug: string
  data: unknown
  meta: LessonMeta | null
}

export default function SubmissionReview({ slug, data, meta }: Props) {
  if (data == null || typeof data !== 'object') {
    return <Empty />
  }

  switch (slug) {
    case 'u1-l1':
      return <QuadrantReview data={data as QuadrantData} meta={meta} />
    case 'u1-l2':
      return <TensionsReview data={data as TensionsData} meta={meta} />
    case 'u1-l3':
      return <ThreadsReview data={data as ThreadsData} meta={meta} />
    case 'u1-l4':
      return <AuditReview data={data as AuditData} meta={meta} />
    case 'u1-l5':
      return <SteelmanReview data={data as SteelmanData} meta={meta} />
    case 'u1-l6':
      return <DeliberationReview data={data as DeliberationData} meta={meta} />
    default:
      return <GenericReview data={data as Record<string, unknown>} />
  }
}

// ---------- shared bits ----------

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={sectionStyle}>
      <div style={sectionLabelStyle}>{label}</div>
      {children}
    </div>
  )
}

function Empty() {
  return <p style={{ color: 'var(--text-faint)', fontSize: '0.9rem', margin: 0 }}>No activity submission recorded for this lesson.</p>
}

function getCustomData<T>(meta: LessonMeta | null): T | null {
  if (meta?.activity?.type === 'custom') return meta.activity.data as T
  return null
}

// ---------- u1-l1 quadrant ----------

type QuadrantData = { x: number; y: number; quadrant: string }

function QuadrantReview({ data, meta }: { data: QuadrantData; meta: LessonMeta | null }) {
  // The quadrant label lives on the quadrant activity spec.
  let label = data.quadrant
  if (meta?.activity?.type === 'quadrant') {
    const q = meta.activity.quadrants.find(q => q.key === data.quadrant)
    if (q) label = q.label
  }
  return (
    <Section label="Where you placed yourself">
      <div style={valueBoxStyle}>{label}</div>
    </Section>
  )
}

// ---------- u1-l2 tensions ----------

type TensionsData = Record<string, { locked?: boolean; position?: number } | undefined>

function TensionsReview({ data, meta }: { data: TensionsData; meta: LessonMeta | null }) {
  const spec = getCustomData<U1L2ActivityData>(meta)
  const scenarios = spec?.scenarios ?? []
  return (
    <Section label="Where you landed on each scenario">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {scenarios.map(s => {
          const key = `scenario${s.index}`
          const placement = data[key]
          const pos = placement?.position
          return (
            <div key={s.key} style={valueBoxStyle}>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>{s.title}</div>
              {typeof pos === 'number' ? <SliderReadout pos={pos} /> : <span style={{ color: 'var(--text-faint)', fontSize: '0.85rem' }}>No response recorded.</span>}
            </div>
          )
        })}
      </div>
    </Section>
  )
}

function SliderReadout({ pos }: { pos: number }) {
  // pos is 0 (liberty) .. 1 (equality). Show a marker on a track.
  const pct = Math.max(0, Math.min(1, pos)) * 100
  return (
    <div>
      <div style={sliderTrackStyle}>
        <span style={{ ...sliderDotStyle, left: `${pct}%` }} />
      </div>
      <div style={sliderScaleStyle}>
        <span style={{ color: 'var(--gold)' }}>← Liberty</span>
        <span style={{ color: '#2980b9' }}>Equality →</span>
      </div>
    </div>
  )
}

// ---------- u1-l3 threads ----------

type ThreadsData = Record<string, { empirical?: string; normative?: string } | boolean | undefined>

function ThreadsReview({ data, meta }: { data: ThreadsData; meta: LessonMeta | null }) {
  const spec = getCustomData<U1L3ActivityData>(meta)
  const claims = spec?.claims ?? []
  return (
    <Section label="How you untangled each claim">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {claims.map(c => {
          const key = `claim${c.index}`
          const entry = data[key]
          const emp = entry && typeof entry === 'object' ? (entry as { empirical?: string }).empirical?.trim() : ''
          const norm = entry && typeof entry === 'object' ? (entry as { normative?: string }).normative?.trim() : ''
          if (!emp && !norm) return null
          return (
            <div key={c.key} style={valueBoxStyle}>
              <div style={{ fontWeight: 600, marginBottom: '0.6rem', fontSize: '0.9rem' }}>{c.claim}</div>
              {emp && <p style={threadLineStyle}><span style={{ ...threadTagStyle, color: 'var(--gold)' }}>Empirical</span> {emp}</p>}
              {norm && <p style={threadLineStyle}><span style={{ ...threadTagStyle, color: '#2980b9' }}>Normative</span> {norm}</p>}
            </div>
          )
        })}
        {claims.every(c => {
          const entry = data[`claim${c.index}`]
          const emp = entry && typeof entry === 'object' ? (entry as { empirical?: string }).empirical?.trim() : ''
          const norm = entry && typeof entry === 'object' ? (entry as { normative?: string }).normative?.trim() : ''
          return !emp && !norm
        }) && <span style={{ color: 'var(--text-faint)', fontSize: '0.85rem' }}>No claims answered.</span>}
      </div>
    </Section>
  )
}

// ---------- u1-l4 audit ----------

type AuditData = {
  side?: 'A' | 'B'
  audit?: { strengths?: string[]; weaknesses?: string[] }
  sidePickedAt?: string
}

function AuditReview({ data, meta }: { data: AuditData; meta: LessonMeta | null }) {
  const spec = getCustomData<U1L4ActivityData>(meta)
  const arg = spec?.arguments.find(a => a.side === data.side)
  const sideLabel = arg ? arg.label : data.side ? `Argument ${data.side}` : '—'
  const strengths = (data.audit?.strengths ?? []).filter(s => s.trim())
  const weaknesses = (data.audit?.weaknesses ?? []).filter(w => w.trim())
  return (
    <>
      <Section label="The side you picked">
        <div style={valueBoxStyle}>{sideLabel}</div>
      </Section>
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <Section label="Your self-audit">
          {strengths.length > 0 && (
            <>
              <div style={subLabelStyle}>What your side does well</div>
              <ul style={listStyle}>{strengths.map((s, i) => <li key={i} style={listItemStyle}>{s}</li>)}</ul>
            </>
          )}
          {weaknesses.length > 0 && (
            <>
              <div style={{ ...subLabelStyle, marginTop: '0.85rem' }}>Where it gets away with something</div>
              <ul style={listStyle}>{weaknesses.map((w, i) => <li key={i} style={listItemStyle}>{w}</li>)}</ul>
            </>
          )}
        </Section>
      )}
    </>
  )
}

// ---------- u1-l5 steelman ----------

type SteelmanData = {
  side?: U1L5Side
  steelman?: { text?: string; submittedAt?: string }
  sidePickedAt?: string
}

function SteelmanReview({ data, meta }: { data: SteelmanData; meta: LessonMeta | null }) {
  const sideName = data.side === 'federal' ? 'Federal authority' : data.side === 'state' ? 'State authority' : '—'
  const opposing = data.side === 'federal' ? 'State authority' : data.side === 'state' ? 'Federal authority' : 'the other side'
  const text = data.steelman?.text?.trim()
  return (
    <>
      <Section label="The side you picked">
        <div style={valueBoxStyle}>{sideName}</div>
      </Section>
      <Section label={`The case you built for ${opposing}`}>
        {text ? <div style={proseBoxStyle}>{text}</div> : <span style={{ color: 'var(--text-faint)', fontSize: '0.85rem' }}>No steelman recorded.</span>}
      </Section>
    </>
  )
}

// ---------- u1-l6 deliberation ----------

type DeliberationData = {
  assignedSide?: U1L6Side
  arguments?: { claim?: string; reason?: string; evidence?: string }[]
  rebuttal?: { predictedOpposing?: string; response?: string }
  submittedAt?: string
}

function DeliberationReview({ data, meta }: { data: DeliberationData; meta: LessonMeta | null }) {
  const spec = getCustomData<U1L6ActivityData>(meta)
  const sideLabel = data.assignedSide && spec
    ? `${data.assignedSide === 'yes' ? 'Yes' : 'No'} — ${spec.sideLabels[data.assignedSide]}`
    : data.assignedSide === 'yes' ? 'Yes' : data.assignedSide === 'no' ? 'No' : '—'
  const args = (data.arguments ?? []).filter(a => a.claim?.trim())
  return (
    <>
      <Section label="The side you were assigned">
        <div style={valueBoxStyle}>{sideLabel}</div>
      </Section>
      {args.length > 0 && (
        <Section label="Your arguments">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {args.map((a, i) => (
              <div key={i} style={valueBoxStyle}>
                <div style={argNumStyle}>Argument {i + 1}</div>
                {a.claim?.trim() && <p style={threadLineStyle}><strong>Claim:</strong> {a.claim}</p>}
                {a.reason?.trim() && <p style={threadLineStyle}><strong>Reason:</strong> {a.reason}</p>}
                {a.evidence?.trim() && <p style={threadLineStyle}><strong>Evidence:</strong> {a.evidence}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}
      {(data.rebuttal?.predictedOpposing?.trim() || data.rebuttal?.response?.trim()) && (
        <Section label="How you predicted and answered the other side">
          <div style={valueBoxStyle}>
            {data.rebuttal?.predictedOpposing?.trim() && <p style={threadLineStyle}><strong>They&rsquo;d argue:</strong> {data.rebuttal.predictedOpposing}</p>}
            {data.rebuttal?.response?.trim() && <p style={threadLineStyle}><strong>Your response:</strong> {data.rebuttal.response}</p>}
          </div>
        </Section>
      )}
    </>
  )
}

// ---------- generic fallback ----------

function GenericReview({ data }: { data: Record<string, unknown> }) {
  return (
    <Section label="Your submission">
      <pre style={genericStyle}>{JSON.stringify(data, null, 2)}</pre>
    </Section>
  )
}

// ---------- styles ----------

const sectionStyle: React.CSSProperties = { marginBottom: '1.75rem' }
const sectionLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--gold)', marginBottom: '0.7rem',
}
const subLabelStyle: React.CSSProperties = {
  fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--text-dim)', marginBottom: '0.5rem',
}
const valueBoxStyle: React.CSSProperties = {
  background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px',
  padding: '0.95rem 1.2rem', fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.55,
}
const proseBoxStyle: React.CSSProperties = {
  background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px',
  padding: '1.1rem 1.3rem', fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.7,
  whiteSpace: 'pre-wrap',
}
const threadLineStyle: React.CSSProperties = {
  fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.6, margin: '0 0 0.4rem',
}
const threadTagStyle: React.CSSProperties = {
  fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
  marginRight: '0.5rem',
}
const argNumStyle: React.CSSProperties = {
  fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--gold)', marginBottom: '0.5rem',
}
const listStyle: React.CSSProperties = {
  margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem',
}
const listItemStyle: React.CSSProperties = {
  fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.55,
}
const sliderTrackStyle: React.CSSProperties = {
  position: 'relative', height: '8px', borderRadius: '999px',
  background: 'linear-gradient(to right, rgba(200,169,110,0.3), rgba(41,128,185,0.3))',
  marginBottom: '0.4rem',
}
const sliderDotStyle: React.CSSProperties = {
  position: 'absolute', top: '50%', width: '16px', height: '16px', borderRadius: '50%',
  background: 'var(--text)', border: '2px solid var(--bg)', transform: 'translate(-50%, -50%)',
}
const sliderScaleStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 600,
  letterSpacing: '0.04em', textTransform: 'uppercase',
}
const genericStyle: React.CSSProperties = {
  background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px',
  padding: '1rem', fontSize: '0.82rem', color: 'var(--text-dim)', overflow: 'auto',
  whiteSpace: 'pre-wrap', fontFamily: 'monospace',
}