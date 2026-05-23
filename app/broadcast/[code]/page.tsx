// app/broadcast/[code]/page.tsx
import { headers } from 'next/headers'
import BroadcastShell, { type State } from './broadcast-shell'
import type { LessonMeta } from '@/lib/lesson-meta-types'

export const dynamic = 'force-dynamic'

async function loadLessonMeta(slug: string): Promise<LessonMeta | null> {
  try {
    const mod = await import(`@/content/lessons/${slug}.meta`)
    return (mod.meta ?? null) as LessonMeta | null
  } catch {
    return null
  }
}

export default async function BroadcastPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  // Fetch initial state from our own API so the server-render is real, not a flash of "loading".
  const h = await headers()
  const host = h.get('host')
  const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')
  const res = await fetch(`${proto}://${host}/api/broadcast/${code.toUpperCase()}/state`, {
    cache: 'no-store',
  })
  const initialState = (await res.json()) as State

  // Preload meta if we have a lesson.
  const initialMeta = initialState.status === 'live' || initialState.status === 'paused'
    ? await loadLessonMeta(initialState.lesson.slug)
    : null

  return (
    <BroadcastShell
      code={code.toUpperCase()}
      initialState={initialState}
      initialMeta={initialMeta}
    />
  )
}