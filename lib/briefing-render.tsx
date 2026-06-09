import React from 'react'
import type { LessonMeta } from '@/lib/lesson-meta-types'

// Renders briefing HTML for STATIC surfaces (archive, teacher prep) — server
// components, no JS. Cascade markers render as a plain visible numbered list;
// expandable markers render as native <details> left OPEN, so all content is
// visible without interaction. The student-live surface has its own interactive
// renderer (BriefingReader); this one guarantees content never disappears in review.
export function renderStaticBriefing(html: string, meta: LessonMeta | null): React.ReactNode {
  const cascades = meta?.briefingCascades ?? {}
  const expandables = meta?.briefingExpandables ?? {}

  // Split on both marker types, capturing kind + key. Pure String.split — SSR-safe.
  const pieces = html.split(/<!--(CASCADE|EXPAND):([\w-]+)-->/)
  // pieces pattern: [text, kind, key, text, kind, key, text, ...]
  const out: React.ReactNode[] = []
  let i = 0
  let k = 0
  while (i < pieces.length) {
    const text = (pieces[i] ?? '').trim()
    if (text) out.push(<div key={`h${k++}`} dangerouslySetInnerHTML={{ __html: text }} />)
    const kind = pieces[i + 1]
    const key = pieces[i + 2]
    if (kind && key) {
      if (kind === 'CASCADE') {
        out.push(<StaticCascade key={`c${k++}`} stages={cascades[key] ?? []} />)
      } else {
        out.push(<StaticExpandables key={`e${k++}`} items={expandables[key] ?? []} />)
      }
      i += 3
    } else {
      i += 1
    }
  }
  return <div className="lesson-reading">{out}</div>
}

function StaticCascade({ stages }: { stages: { num: string; title: string; body: string }[] }) {
  if (stages.length === 0) return null
  return (
    <div className="lesson-cascade">
      {stages.map((s, i) => (
        <div key={i} className="lesson-cascade-stage revealed">
          <div className="lesson-cascade-num">{s.num}</div>
          <div className="lesson-cascade-content">
            <strong>{s.title}</strong>
            <p>{s.body}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function StaticExpandables({ items }: { items: { icon?: string; title: string; body: string }[] }) {
  if (items.length === 0) return null
  return (
    <div className="lesson-framework-list">
      {items.map((it, i) => (
        <details key={i} className="lesson-framework-row" open>
          <summary>
            {it.icon && <span className="lesson-fw-icon">{it.icon}</span>}
            <span className="lesson-fw-title">{it.title}</span>
            <span className="lesson-fw-toggle" />
          </summary>
          <div className="lesson-fw-body" dangerouslySetInnerHTML={{ __html: it.body }} />
        </details>
      ))}
    </div>
  )
}