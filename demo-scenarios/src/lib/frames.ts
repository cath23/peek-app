import { useCallback, useEffect, useRef, useState } from 'react'

// ── Talking to the embedded app ──
//
// The film embeds the real Peek app three times, all in demo mode, all
// speaking the protocol in src/demo/demoBridge.ts:
//
//   app  — the whole app, its own highlights card hidden until the handoff, so
//          the topic reads as empty while the card is still flying in.
//   bar  — clipped to the COLLAPSED card. This is what the whip brings in.
//   card — clipped to the EXPANDED card. This is what springs open and docks.
//
// Why two clipped copies instead of one that expands: the collapsed and
// expanded layouts put the card in different places, so asking a frame to
// expand mid-beat would show the wrong slice for a frame or two while the
// message crossed. Each frame is put into its state once, before playback, and
// never touched again — so the swap is exact, and it lands on the frame where
// the button label changes, which is precisely what a click looks like.
//
// Geometry is collected up front too: a timeline that awaits something mid-run
// can't be scrubbed backwards.

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Geometry {
  collapsed: Rect
  expanded: Rect
}

export const FRAME_IDS = ['app', 'bar', 'card'] as const
export type FrameId = (typeof FRAME_IDS)[number]

const TAG = 'peek-demo'

/** Where the embedded app lives. Override with ?peek=http://host:port. */
export function peekOrigin(): string {
  return new URLSearchParams(window.location.search).get('peek') ?? 'http://localhost:5173'
}

export function peekSrc(frame: FrameId): string {
  return `${peekOrigin()}/topics/10?demo=1&frame=${frame}`
}

export interface FrameLink {
  id: FrameId
  ref: (el: HTMLIFrameElement | null) => void
  send: (type: string, payload?: Record<string, unknown>) => void
}

export interface Frames {
  links: Record<FrameId, FrameLink>
  /** Card geometry, once every frame has reported in. */
  geometry: Geometry | null
}

export function usePeekFrames(): Frames {
  const els = useRef<Partial<Record<FrameId, HTMLIFrameElement | null>>>({})
  const seen = useRef<Partial<Record<FrameId, Geometry>>>({})
  const [geometry, setGeometry] = useState<Geometry | null>(null)

  const send = useCallback((frame: FrameId, type: string, payload?: Record<string, unknown>) => {
    els.current[frame]?.contentWindow?.postMessage({ source: TAG, type, ...payload }, '*')
  }, [])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const d = e.data
      if (typeof d !== 'object' || d === null || d.source !== TAG) return
      const frame = d.frame as FrameId
      if (d.type === 'ready') {
        send(frame, 'calibrate')
        return
      }
      if (d.type !== 'geometry') return
      seen.current[frame] = { collapsed: d.collapsed, expanded: d.expanded }
      if (!FRAME_IDS.every((id) => seen.current[id])) return

      // Every frame renders the same app at the same size, so the card must
      // land in the same place in each. If it doesn't, the swap and the
      // handoff would visibly jump — worth knowing about.
      const ref = seen.current.app!
      for (const id of FRAME_IDS) {
        const g = seen.current[id]!
        const drift =
          Math.abs(g.expanded.y - ref.expanded.y) +
          Math.abs(g.expanded.x - ref.expanded.x) +
          Math.abs(g.collapsed.y - ref.collapsed.y)
        if (drift > 1) console.warn(`[demo] frame "${id}" disagrees on the card position by ${drift}px`)
      }

      // Put each frame into the one state it holds for the whole film.
      send('app', 'set-card-visible', { visible: false })
      send('app', 'set-expanded', { expanded: true })
      send('bar', 'set-expanded', { expanded: false })
      send('card', 'set-expanded', { expanded: true })
      setGeometry(ref)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [send])

  const link = (id: FrameId): FrameLink => ({
    id,
    ref: (el) => {
      els.current[id] = el
    },
    send: (type, payload) => send(id, type, payload),
  })

  return {
    links: { app: link('app'), bar: link('bar'), card: link('card') },
    geometry,
  }
}
