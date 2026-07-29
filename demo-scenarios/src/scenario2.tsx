import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { BrandCard } from './scenes/BrandCard'
import { CursorArrow, TIP_X, TIP_Y } from './scenes/CursorArrow'
import { Window } from './scenes/Window'
import { FigmaWindow } from './scenes/figma/FigmaWindow'
import { ASK_TEXT, AI_PANEL_Y } from './scenes/figma/AiPanel'
import { CHROME_H, STAGE_H, STAGE_W, toStage } from './lib/stage'

gsap.registerPlugin(SplitText)

// ── Scenario 2 — "The answer just shows up", one orchestrated take ──
//
// Title over the blurred Figma canvas → focus pulls and the canvas settles →
// the cursor clicks into the AI panel while the camera punches toward it →
// the ask types on in a quick burst → send — the chat renames itself → the
// spark spins while "Asking Linear sub-agent…" shines one row after the
// other, twice, unhurried → the thinking dissolves and the answer replaces
// it: "I've left 3 comments on the canvas:" then three feedback widgets →
// the camera pulls wide WHILE the panel slips away and the pins pop onto the
// drafts → punch into the sticky-note corner → the comment blooms out of its
// pin (contents hidden from frame 0, revealed exactly once) → dead-still
// read → the mirror.
//
// Same rig discipline as scenario 1: one paused master timeline, one writer
// per element, all state derived from the playhead. The camera is a real rig
// (x, y, zoom on one wrapper) because this film has two punch-in targets;
// framings are computed, never hand-tuned to a layout.

const T = {
  brandIn: 0.2,
  brandOut: 1.6,
  reveal: 1.85, // blur clears + the canvas scales up and settles, under the title's exit
  cursor: 2.5,
  punchIn: 2.85, // camera moves while the cursor is still travelling
  clickInput: 3.45,
  type: 3.6,
  send: 5.15,
  rename: 5.55, // the AI names the chat just after the ask arrives
  status: 5.75, // the sub-agent moment — spark spins, rows shine in turn
  answer: 9.9, // thinking dissolves; the answer takes its place
  widgets: 10.3,
  pullOut: 11.9, // camera widens WHILE the panel slips away
  pins: 12.2,
  punchHero: 12.95,
  bloom: 13.45,
  read: 14.05, // dead still — the reading time (ruling: read after placement)
  endBlur: 15.65,
  brandBack: 15.9,
  end: 18.1,
}

/** Camera framings. A target is "point P (window-local) at frame centre,
 *  zoom Z"; between targets the three values tween on one curve. The panel
 *  framing is biased left of the panel's centre so the frame holds the panel
 *  AND the drafts it is talking about — and never the void past the window's
 *  right edge (window right edge at Z1.6 needs centre.x ≲ 903 in stage px). */
const PANEL_CENTER = { x: 919, y: 635 }
const PANEL_ZOOM = 1.6
const DRIFT_ZOOM = 1.64 // the camera never dies while the sub-agent works
/** The sticky-note corner: sticky + hero pin + opened thread, framed together. */
const HERO_CENTER = { x: 869, y: 590 }
const HERO_ZOOM = 1.85

const camTarget = (z: number, wx: number, wy: number) => {
  const p = toStage(wx, wy)
  return { camZ: z, camX: STAGE_W / 2 - z * p.x, camY: STAGE_H / 2 - z * p.y }
}

export function Scenario2Layers() {
  return (
    <>
      {/* The void, same surface as scenario 1. */}
      <div className="absolute inset-0" style={{ backgroundColor: '#07080a' }}>
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.2,
            background:
              'radial-gradient(1000px 560px at 50% 46%, rgba(86,200,255,0.2), rgba(86,200,255,0.05) 45%, transparent 72%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.5,
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/><feColorMatrix type='saturate' values='0'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.055'/></svg>\")",
          }}
        />
      </div>

      {/* Everything the camera sees: the window and the cursor that lives in
          its world. The camera transforms this wrapper only. */}
      <div data-camera className="absolute inset-0" style={{ transformOrigin: '0 0' }}>
        <div data-layer="figma" className="absolute inset-0">
          <Window>
            <FigmaWindow />
          </Window>
        </div>
        <CursorArrow />
      </div>

      <BrandCard line="The answer just shows up." />
    </>
  )
}

interface State {
  camX: number
  camY: number
  camZ: number
  typeP: number
}

export function buildScenario2(opts: { root: HTMLElement }): {
  tl: gsap.core.Timeline
  dispose: () => void
} {
  const { root } = opts
  const q = gsap.utils.selector(root)
  const one = <T extends Element>(sel: string) => q(sel)[0] as unknown as T

  const camera = one<HTMLElement>('[data-camera]')
  const figma = one<HTMLElement>('[data-layer="figma"]')
  const cursor = one<HTMLElement>('[data-layer="cursor"]')
  const flash = one<HTMLElement>('[data-layer="click-flash"]')
  const brand = one<HTMLElement>('[data-layer="brand"]')
  const brandMark = one<HTMLElement>('[data-brand-mark]')

  const titleNew = one<HTMLElement>('[data-ai-title-new]')
  const titleNamed = one<HTMLElement>('[data-ai-title-named]')
  const bubble = one<HTMLElement>('[data-ai-bubble]')
  const status = one<HTMLElement>('[data-ai-status]')
  const spark = one<HTMLElement>('[data-ai-spark]')
  const shim1 = one<HTMLElement>('[data-ai-shim1]')
  const shim2 = one<HTMLElement>('[data-ai-shim2]')
  const widgets = q('[data-ai-fb]') as HTMLElement[]
  const replyLine = one<HTMLElement>('[data-ai-replyline]')
  const inputText = one<HTMLElement>('[data-ai-input-text]')
  const caret = one<HTMLElement>('[data-ai-caret]')
  const placeholder = one<HTMLElement>('[data-ai-placeholder]')
  const send = one<HTMLElement>('[data-ai-send]')
  const sendArrow = one<SVGElement>('[data-ai-send-arrow]')
  const panel = one<HTMLElement>('[data-ai-panel]')
  const pins = q('[data-pin]') as HTMLElement[]
  const heroRing = one<HTMLElement>('[data-pin="hero"] [data-pin-ring]')
  const thread = one<HTMLElement>('[data-thread]')
  const threadItems = Array.from(thread.children) as HTMLElement[]

  const split = SplitText.create(q('[data-brand-line]'), { type: 'words', mask: 'words' })

  const s: State = { camX: 0, camY: 0, camZ: 1, typeP: 0 }

  let shownChars = -1
  const render = () => {
    camera.style.transform = `translate(${s.camX}px, ${s.camY}px) scale(${s.camZ})`
    // Whole characters only — a glyph can't half-arrive.
    const n = Math.round(s.typeP * ASK_TEXT.length)
    if (n !== shownChars) {
      shownChars = n
      inputText.textContent = ASK_TEXT.slice(0, n)
      placeholder.style.opacity = n > 0 ? '0' : '1'
    }
  }

  const tipAt = (wx: number, wy: number) => {
    const p = toStage(wx, wy)
    return { x: p.x - TIP_X, y: p.y - TIP_Y }
  }
  /** Window-local points the cursor visits (the camera carries it, so these
   *  stay glued to the UI through every punch). */
  const INPUT_AT = { x: 1022, y: CHROME_H + AI_PANEL_Y + 390 }
  const SEND_AT = { x: 1311, y: CHROME_H + AI_PANEL_Y + 387 }

  const tl = gsap.timeline({ paused: true })

  // Ticker-driven, not onUpdate — seeking suppresses timeline callbacks.
  gsap.ticker.add(render)

  // Frame 0.
  gsap.set(figma, {
    transformOrigin: '50% 50%',
    scale: 0.95,
    y: 14,
    filter: 'blur(16px) brightness(0.55)',
  })
  gsap.set(cursor, { ...tipAt(1350, 1075), opacity: 0, scale: 1 })
  gsap.set(flash, { opacity: 0, scale: 0.5 })
  gsap.set(brand, { opacity: 0 })
  gsap.set(titleNamed, { opacity: 0 })
  gsap.set(bubble, { opacity: 0 })
  gsap.set(status, { opacity: 0 })
  gsap.set([replyLine, ...widgets], { opacity: 0 })
  gsap.set(caret, { opacity: 0 })
  gsap.set(pins, { scale: 0 })
  gsap.set(thread, { opacity: 0, scale: 0.55 })
  // Hidden from frame 0 so the bloom reveals them exactly once — with the
  // natural DOM state visible, the container fade-in showed the contents,
  // then the reveal tween reset them to invisible and faded them in again.
  gsap.set(threadItems, { opacity: 0 })
  render()

  // ── Bookend, first pass: small, over the blurred canvas. ──
  tl.to(brand, { opacity: 1, duration: 0.3, ease: 'power1.out' }, T.brandIn)
  tl.from(brandMark, { y: 12, opacity: 0, duration: 0.55, ease: 'back.out(1.4)' }, T.brandIn)
  tl.from(split.words, { yPercent: 118, duration: 0.6, ease: 'back.out(1.6)', stagger: 0.05 }, T.brandIn + 0.16)
  tl.addLabel('brandOut', T.brandOut)
  tl.to(brand, { opacity: 0, y: -10, duration: 0.45, ease: 'power2.inOut' }, T.brandOut)

  // ── Focus pull: the canvas sharpens, grows a little, settles into centre —
  //    scenario 1's exact entrance (ruling: same transitions). ──
  tl.addLabel('reveal', T.reveal)
  tl.to(figma, { scale: 1, y: 0, duration: 0.75, ease: 'power2.out' }, T.reveal)
  tl.to(figma, { filter: 'blur(0px) brightness(1)', duration: 0.7, ease: 'power2.out' }, T.reveal)

  // ── The ask. The cursor enters while the frame is still sharpening and
  //    arcs to the AI panel's input; the camera punches toward the panel
  //    while the cursor is still travelling. ──
  tl.addLabel('cursor', T.cursor)
  tl.to(cursor, { opacity: 1, duration: 0.16, ease: 'power1.out' }, T.cursor - 0.05)
  tl.to(
    cursor,
    {
      keyframes: [
        { ...tipAt(1120, 920), duration: 0.45, ease: 'power2.inOut' },
        { ...tipAt(INPUT_AT.x + 10, INPUT_AT.y - 6), duration: 0.32, ease: 'power1.inOut' },
        { ...tipAt(INPUT_AT.x, INPUT_AT.y), duration: 0.16, ease: 'power2.out' },
      ],
    },
    T.cursor,
  )
  tl.addLabel('punchIn', T.punchIn)
  tl.to(s, { ...camTarget(PANEL_ZOOM, PANEL_CENTER.x, PANEL_CENTER.y), duration: 0.95, ease: 'power3.inOut' }, T.punchIn)
  tl.addLabel('clickInput', T.clickInput)
  tl.to(cursor, { scale: 0.86, duration: 0.06, yoyo: true, repeat: 1, ease: 'power2.inOut' }, T.clickInput)
  tl.to(caret, { opacity: 1, duration: 0.01 }, T.clickInput + 0.08)
  tl.to(caret, { opacity: 0, duration: 0.01 }, T.clickInput + 0.32)
  tl.to(caret, { opacity: 1, duration: 0.01 }, T.clickInput + 0.5)
  tl.to(cursor, { opacity: 0, duration: 0.25, ease: 'power1.in' }, T.clickInput + 0.2)

  // ── Typing, one quick confident burst with two micro-hitches. The send
  //    arrow wakes up on the first character. ──
  tl.addLabel('type', T.type)
  tl.to(send, { backgroundColor: '#0c8ce9', duration: 0.25, ease: 'power1.out' }, T.type + 0.06)
  tl.to(sendArrow, { stroke: '#ffffff', duration: 0.25, ease: 'power1.out' }, T.type + 0.06)
  tl.to(
    s,
    {
      immediateRender: false,
      keyframes: [
        { typeP: 0.16, duration: 0.28, ease: 'none' },
        { typeP: 0.18, duration: 0.08, ease: 'none' },
        { typeP: 0.58, duration: 0.52, ease: 'none' },
        { typeP: 0.61, duration: 0.1, ease: 'none' },
        { typeP: 1, duration: 0.47, ease: 'none' },
      ],
    },
    T.type,
  )

  // ── Send: the cursor hops to the arrow, presses, and the ask becomes the
  //    bubble on the beat the input clears. A moment later the AI names the
  //    chat: "New chat" → "Request for feedback on draft". ──
  tl.to(cursor, { opacity: 1, duration: 0.12, ease: 'power1.out' }, T.send - 0.35)
  tl.to(cursor, { ...tipAt(SEND_AT.x, SEND_AT.y), duration: 0.32, ease: 'power2.inOut' }, T.send - 0.35)
  tl.addLabel('send', T.send)
  tl.to(cursor, { scale: 0.86, duration: 0.06, yoyo: true, repeat: 1, ease: 'power2.inOut' }, T.send)
  tl.to(send, { scale: 0.88, duration: 0.07, yoyo: true, repeat: 1, ease: 'power2.inOut' }, T.send)
  tl.fromTo(
    flash,
    { ...toStage(SEND_AT.x, SEND_AT.y), opacity: 0.55, scale: 0.32 },
    { opacity: 0, scale: 1.1, duration: 0.35, ease: 'power2.out', immediateRender: false },
    T.send,
  )
  tl.to(caret, { opacity: 0, duration: 0.01 }, T.send)
  tl.to(s, { typeP: 0, duration: 0.001 }, T.send + 0.06)
  // The field is empty again, so the arrow goes back to sleep.
  tl.to(send, { backgroundColor: '#4e4e4e', duration: 0.2, ease: 'power1.out' }, T.send + 0.1)
  tl.to(sendArrow, { stroke: '#9e9e9e', duration: 0.2, ease: 'power1.out' }, T.send + 0.1)
  tl.fromTo(
    bubble,
    { opacity: 0, y: 10, scale: 0.96 },
    { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.8)', immediateRender: false },
    T.send + 0.06,
  )
  tl.to(cursor, { opacity: 0, duration: 0.3, ease: 'power1.in' }, T.send + 0.25)
  tl.addLabel('rename', T.rename)
  tl.to(titleNew, { opacity: 0, y: -4, duration: 0.22, ease: 'power2.in' }, T.rename)
  tl.fromTo(
    titleNamed,
    { opacity: 0, y: 4 },
    { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out', immediateRender: false },
    T.rename + 0.12,
  )

  // ── The sub-agent moment, unhurried: the spark spins the whole time and
  //    the shine passes row one, then row two — twice — while the camera
  //    drifts a breath. Real thinking takes a moment. ──
  tl.addLabel('status', T.status)
  tl.fromTo(
    status,
    { opacity: 0, y: 6 },
    { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', immediateRender: false },
    T.status,
  )
  tl.fromTo(
    spark,
    { rotation: 0 },
    { rotation: 1440, duration: 4.15, ease: 'none', immediateRender: false },
    T.status + 0.05,
  )
  for (const [el, at] of [
    [shim1, 6.0],
    [shim2, 6.6],
    [shim1, 8.0],
    [shim2, 8.6],
  ] as const) {
    tl.fromTo(
      el,
      { backgroundPosition: '100% 0' },
      { backgroundPosition: '-150% 0', duration: 1.2, ease: 'none', immediateRender: false },
      at,
    )
  }
  tl.to(s, { ...camTarget(DRIFT_ZOOM, PANEL_CENTER.x, PANEL_CENTER.y), duration: 3.9, ease: 'power1.inOut' }, T.status)

  // ── The answer replaces the thinking: the status dissolves, and in its
  //    place the line lands first, then the three feedback widgets pop in
  //    below it, one after another (ruling: line, then widgets). ──
  tl.addLabel('answer', T.answer)
  tl.to(status, { opacity: 0, y: -6, duration: 0.3, ease: 'power2.in' }, T.answer)
  tl.fromTo(
    replyLine,
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', immediateRender: false },
    T.answer + 0.18,
  )
  tl.fromTo(
    widgets,
    { opacity: 0, y: 12, scale: 0.97 },
    { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.7)', stagger: 0.16, immediateRender: false },
    T.widgets,
  )

  // ── Out of the chat, onto the work: the camera widens WHILE the panel
  //    slips away, and the pins pop onto the design one after another —
  //    left to right, ending next to the sticky note. ──
  tl.addLabel('pullOut', T.pullOut)
  tl.to(s, { camX: 0, camY: 0, camZ: 1, duration: 1.0, ease: 'power3.inOut' }, T.pullOut)
  tl.to(panel, { opacity: 0, y: 26, scale: 0.98, duration: 0.45, ease: 'power2.in' }, T.pullOut + 0.12)
  tl.addLabel('pins', T.pins)
  pins.forEach((pin, i) => {
    tl.fromTo(
      pin,
      { scale: 0 },
      { scale: 1, duration: 0.55, ease: 'back.out(2.2)', immediateRender: false },
      T.pins + i * 0.22,
    )
  })

  // ── The bloom: punch into the sticky-note corner while the last pin is
  //    still settling; the comment opens out of its pin, contents arriving a
  //    breath behind the surface — once. ──
  tl.addLabel('punchHero', T.punchHero)
  tl.to(s, { ...camTarget(HERO_ZOOM, HERO_CENTER.x, HERO_CENTER.y), duration: 0.95, ease: 'power3.inOut' }, T.punchHero)
  tl.addLabel('bloom', T.bloom)
  tl.fromTo(
    thread,
    { opacity: 0, scale: 0.55 },
    { opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(1.7)', immediateRender: false },
    T.bloom,
  )
  tl.fromTo(
    threadItems,
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', stagger: 0.06, immediateRender: false },
    T.bloom + 0.12,
  )
  // Figma's opened-comment highlight: the blue ring lights the hero pin so
  // you know which comment is open.
  tl.fromTo(
    heroRing,
    { opacity: 0, scale: 0.6 },
    { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)', immediateRender: false },
    T.bloom + 0.05,
  )

  // ── The read: dead still. Then the mirror — the topic sinks into exactly
  //    the opening's blur-and-dim and the same small title returns. First
  //    frame: a draft with a question stuck to it. Last: the answer, placed. ──
  tl.addLabel('read', T.read)
  tl.addLabel('endBlur', T.endBlur)
  tl.to(s, { camX: 0, camY: 0, camZ: 1, duration: 0.9, ease: 'power2.inOut' }, T.endBlur)
  tl.to(figma, { filter: 'blur(16px) brightness(0.55)', scale: 0.97, duration: 0.7, ease: 'power2.inOut' }, T.endBlur + 0.25)
  tl.addLabel('brandBack', T.brandBack + 0.25)
  tl.to(brand, { opacity: 1, y: 0, duration: 0.3, ease: 'power1.out' }, T.brandBack + 0.25)
  tl.fromTo(
    brandMark,
    { y: 12, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.55, ease: 'back.out(1.4)', immediateRender: false },
    T.brandBack + 0.25,
  )
  tl.fromTo(
    split.words,
    { yPercent: 118 },
    { yPercent: 0, duration: 0.6, ease: 'back.out(1.6)', stagger: 0.05, immediateRender: false },
    T.brandBack + 0.39,
  )
  tl.to({}, { duration: 0.1 }, T.end)

  ;(window as unknown as { __state?: State }).__state = s

  return {
    tl,
    dispose: () => {
      gsap.ticker.remove(render)
      tl.kill()
      split.revert()
    },
  }
}
