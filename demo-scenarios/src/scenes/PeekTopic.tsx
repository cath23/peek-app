import { useEffect, useRef, useState } from 'react'
import { BrowserChrome } from './BrowserChrome'
import peekFavicon from '../assets/meet/peek-favicon.svg'

// ── Scenario 1, scene 3: Peek, the Payment integration topic ──
//
// The REAL app in an iframe (not a rebuilt mock), running in demo mode:
// `?demo=1` makes it serve the scenario dataset with no login and no live
// backend — see src/demo/ in the app and STORYBOARD.md here.
//
// Beats:
//   0 — the topic as you'd find it: the highlights the call produced have
//       landed as a collapsed bar at the bottom of the stream.
//   1 — the camera pushes in on that bar and the card expands as the camera
//       arrives, the way a product demo cuts to a close-up.
//   2 — the camera pulls back out, expanded card in context.
//
// The camera is a CSS transform on the whole browser-framed screen, driven by
// the card's real position: the app reports its rect over postMessage (see
// src/demo/demoBridge.ts) and this scene frames it. Nothing is hardcoded to
// a layout, so it keeps working as the app's UI changes.

const VIEW_W = 1440
const VIEW_H = 945
/** Chrome height — content sits at the same offset as the Meet scenes. */
const CHROME_H = 79

/**
 * Beat 1's zoom comes from the card's WIDTH: filling the frame with it, edge
 * to edge bar a margin, is as far in as the camera can go without cutting the
 * card in half. That width doesn't change when the card opens, so the zoom is
 * the same before and after — a camera that zooms in and then back out to
 * re-frame reads as hunting for its subject.
 */
const FOCUS_MARGIN = 24
const ZOOM_MIN = 1.2
const ZOOM_MAX = 1.6

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface Camera {
  z: number
  tx: number
  ty: number
}

const REST: Camera = { z: 1, tx: 0, ty: 0 }

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

/**
 * Frame `rect`: centred, or top-aligned when it is too tall to fit, so a long
 * card is read from the top down. Panning is clamped to the page, because
 * empty space beyond its edges reads as a mistake on film.
 */
function frame(rect: Rect): Camera {
  const z = clamp((VIEW_W - 2 * FOCUS_MARGIN) / rect.width, ZOOM_MIN, ZOOM_MAX)
  const fits = z * rect.height <= VIEW_H - 2 * FOCUS_MARGIN
  const ty = fits
    ? VIEW_H / 2 - z * (rect.y + rect.height / 2)
    : FOCUS_MARGIN - z * rect.y
  return {
    z,
    tx: clamp(VIEW_W / 2 - z * (rect.x + rect.width / 2), VIEW_W - z * VIEW_W, 0),
    ty: clamp(ty, VIEW_H - z * VIEW_H, 0),
  }
}

/** Where the embedded app lives. Override with ?peek=http://host:port. */
function peekOrigin(): string {
  const p = new URLSearchParams(window.location.search).get('peek')
  return p ?? 'http://localhost:5173'
}

export function PeekTopic({ beat }: { beat: number }) {
  const [rect, setRect] = useState<Rect | null>(null)
  const [expandedRect, setExpandedRect] = useState<Rect | null>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const timers = useRef<number[]>([])

  const send = (type: string) =>
    frameRef.current?.contentWindow?.postMessage({ source: 'peek-demo', type }, '*')

  // The app reports where the highlights card is, before and after it opens.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const d = e.data
      if (typeof d !== 'object' || d === null || d.source !== 'peek-demo') return
      if (d.type === 'card-rect') {
        if (d.expanded) setExpandedRect(d.rect as Rect)
        else setRect(d.rect as Rect)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    const clear = () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
    clear()
    if (beat === 0) {
      send('collapse')
      setExpandedRect(null)
    } else if (beat === 1) {
      // Start moving immediately, open the card a beat later: the reveal then
      // lands while the camera is still travelling, which is what makes the
      // whole thing feel directed rather than mechanical.
      timers.current.push(window.setTimeout(() => send('expand'), 260))
    }
    return clear
  }, [beat])

  // Beat 1 pushes in on the collapsed bar, then drifts to the opened card as
  // the app reports its new size — same zoom throughout, so CSS interpolates
  // one continuous move out of the two targets.
  let camera = REST
  if (beat === 1) {
    const focus = expandedRect ?? rect
    if (focus) camera = frame(focus)
  }

  return (
    <div className="bg-white relative size-full">
      <BrowserChrome
        tabTitle="Payment integration"
        urlHost="app.peek.com"
        urlPath="/topics/payment-integration"
        favicon={peekFavicon}
      />

      <div
        className="absolute left-0 overflow-clip"
        style={{ top: CHROME_H, width: VIEW_W, height: VIEW_H, backgroundColor: '#12151a' }}
      >
        <div
          style={{
            width: VIEW_W,
            height: VIEW_H,
            transformOrigin: '0 0',
            transform: `translate(${camera.tx}px, ${camera.ty}px) scale(${camera.z})`,
            transition: 'transform 900ms cubic-bezier(0.32, 0.72, 0.16, 1)',
          }}
        >
          {/* pointer-events: none keeps clicks on the stage (they step the
              player) and keeps keyboard focus out of the iframe, so → / ←
              never stop responding mid-recording. */}
          <iframe
            ref={frameRef}
            title="Peek"
            src={`${peekOrigin()}/topics/10?demo=1`}
            width={VIEW_W}
            height={VIEW_H}
            style={{ border: 0, display: 'block', pointerEvents: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}
