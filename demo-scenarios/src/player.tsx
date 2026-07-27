import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { usePeekFrames } from './lib/frames'
import { Scenario1Layers, buildScenario1 } from './scenario1'

// ── Scenario player ──
//
// A fixed 1440×1024 stage auto-scaled to the window, and one paused GSAP
// master timeline. Nothing plays in response to a keypress: the keys seek the
// timeline. That buys identical takes every recording, `?t=` deep links into
// any moment, and GSDevTools scrubbing while tuning.
//
//   Space  play / pause          → / ←  next / previous beat
//   R      restart and play      Home   back to the start
//   H      hide the HUD          G      GSDevTools (tuning)
//
// Playback waits until every embedded app frame has reported its geometry, so
// a slow dev-server compile can never be caught on film.

const STAGE_W = 1440
const STAGE_H = 1024

export function Player() {
  const params = new URLSearchParams(window.location.search)
  const stageRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const { links, geometry } = usePeekFrames()

  const [scale, setScale] = useState(1)
  const [hud, setHud] = useState(() => params.get('hud') !== '0')
  const [status, setStatus] = useState('loading the app…')

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  // Build once the app frames have been measured and the fonts are in — the
  // title is split into words, and splitting before the font loads measures
  // the wrong line breaks.
  useEffect(() => {
    if (!geometry || !stageRef.current) return
    let disposed = false
    let dispose = () => {}
    void document.fonts.ready.then(() => {
      if (disposed || !stageRef.current) return
      const built = buildScenario1({ root: stageRef.current, geometry, links })
      tlRef.current = built.tl
      dispose = built.dispose
      // Tuning handle: `__tl.pause(6.7)` in the console parks the film on any
      // frame, and the screenshot checks drive it the same way.
      ;(window as unknown as { __tl?: gsap.core.Timeline }).__tl = built.tl

      const at = params.get('t')
      if (at) built.tl.seek(Number.isNaN(Number(at)) ? at : Number(at))
      if (params.get('autoplay') === '1') built.tl.play()
      setStatus(describe(built.tl))
    })
    return () => {
      disposed = true
      dispose()
      tlRef.current = null
    }
    // links is a stable set of callbacks over the frame refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tl = tlRef.current
      if (e.key === 'h' || e.key === 'H') setHud((v) => !v)
      if (!tl) return
      switch (e.key) {
        case ' ':
          e.preventDefault()
          tl.paused() ? tl.play() : tl.pause()
          break
        case 'ArrowRight':
          tl.pause()
          tl.seek(neighbourLabel(tl, 1))
          break
        case 'ArrowLeft':
          tl.pause()
          tl.seek(neighbourLabel(tl, -1))
          break
        case 'r':
        case 'R':
          tl.restart()
          break
        case 'Home':
          tl.pause(0)
          break
        case 'g':
        case 'G':
          void openDevTools(tl)
          break
      }
      setStatus(describe(tl))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Keep the HUD honest during playback without re-rendering every frame.
  useEffect(() => {
    if (!hud) return
    const id = window.setInterval(() => {
      if (tlRef.current) setStatus(describe(tlRef.current))
    }, 120)
    return () => window.clearInterval(id)
  }, [hud])

  return (
    <div className="player">
      <div
        ref={stageRef}
        className="stage"
        style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}
      >
        <Scenario1Layers links={links} />
      </div>
      {hud && <div className="hud">S1 · {status} — space play, → ← beats, R restart, H hud, G tune</div>}
    </div>
  )
}

/** Label at the playhead, and the time, for the HUD. */
function describe(tl: gsap.core.Timeline): string {
  const labels = sortedLabels(tl)
  const t = tl.time()
  const current = [...labels].reverse().find((l) => t >= l.time - 0.001)
  return `${current?.name ?? 'start'} · ${t.toFixed(2)}s / ${tl.duration().toFixed(2)}s${
    tl.paused() ? '' : ' ▶'
  }`
}

function sortedLabels(tl: gsap.core.Timeline): { name: string; time: number }[] {
  return Object.entries(tl.labels)
    .map(([name, time]) => ({ name, time: time as number }))
    .sort((a, b) => a.time - b.time)
}

/** The next / previous beat, so → and ← step the film rather than scrub it. */
function neighbourLabel(tl: gsap.core.Timeline, dir: 1 | -1): number {
  const labels = sortedLabels(tl)
  const t = tl.time()
  if (dir === 1) return labels.find((l) => l.time > t + 0.01)?.time ?? tl.duration()
  return [...labels].reverse().find((l) => l.time < t - 0.01)?.time ?? 0
}

/** Loaded on demand: it is a tuning tool, and it draws its own UI over the
 *  stage, so it must never be in a take. */
let devTools: unknown = null
async function openDevTools(tl: gsap.core.Timeline) {
  if (devTools) return
  const { GSDevTools } = await import('gsap/GSDevTools')
  gsap.registerPlugin(GSDevTools)
  devTools = GSDevTools.create({ animation: tl })
}
