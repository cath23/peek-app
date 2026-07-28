import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Scenario2Layers, buildScenario2 } from './scenario2'

// ── Scenario 2 player ──
//
// The same seekable rig as scenario 1 (see player.tsx for the rationale), but
// with no embedded app frames: every pixel of the Figma scene is hand-built,
// so the only thing playback waits for is the fonts.
//
//   Space  play / pause          → / ←  next / previous beat
//   R      restart and play      Home   back to the start
//   H      hide the HUD          G      GSDevTools (tuning)

const STAGE_W = 1440
const STAGE_H = 1024

export function Player2() {
  const params = new URLSearchParams(window.location.search)
  const stageRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  const [scale, setScale] = useState(1)
  const [hud, setHud] = useState(() => params.get('hud') !== '0')
  const [status, setStatus] = useState('loading fonts…')

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  useEffect(() => {
    if (!stageRef.current) return
    let disposed = false
    let dispose = () => {}
    void document.fonts.ready.then(() => {
      if (disposed || !stageRef.current) return
      const built = buildScenario2({ root: stageRef.current })
      tlRef.current = built.tl
      dispose = built.dispose
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        <Scenario2Layers />
      </div>
      {hud && <div className="hud">S2 · {status} — space play, → ← beats, R restart, H hud, G tune</div>}
    </div>
  )
}

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

function neighbourLabel(tl: gsap.core.Timeline, dir: 1 | -1): number {
  const labels = sortedLabels(tl)
  const t = tl.time()
  if (dir === 1) return labels.find((l) => l.time > t + 0.01)?.time ?? tl.duration()
  return [...labels].reverse().find((l) => l.time < t - 0.01)?.time ?? 0
}

let devTools: unknown = null
async function openDevTools(tl: gsap.core.Timeline) {
  if (devTools) return
  const { GSDevTools } = await import('gsap/GSDevTools')
  gsap.registerPlugin(GSDevTools)
  devTools = GSDevTools.create({ animation: tl })
}
