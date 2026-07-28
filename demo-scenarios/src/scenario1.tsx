import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { MeetCall } from './scenes/MeetCall'
import { GenieMeet, GENIE_STRIPS, GENIE_STRIP_H } from './scenes/GenieMeet'
import { BrandCard } from './scenes/BrandCard'
import { CursorArrow, TIP_X, TIP_Y } from './scenes/CursorArrow'
import { PeekWindow } from './scenes/PeekWindow'
import { ClippedFrame } from './scenes/ClippedFrame'
import { Window } from './scenes/Window'
import { CHROME_H, STAGE_H, STAGE_W, VIEW_H, VIEW_W, WINDOW_SCALE, toStage } from './lib/stage'
import type { FrameId, FrameLink, Geometry, Rect } from './lib/frames'

gsap.registerPlugin(SplitText)

// ── Scenario 1, v3 — one orchestrated take ──
//
// Title over the blurred call → focus pulls and the call settles into place →
// the click → the window pours away, macOS-genie → the highlights streak in
// while it's still pouring → fast playful open → the topic approaches from
// depth behind the card → the card is pulled in like taffy and lands above the
// composer → the same title returns over the blurred topic.
//
// The governing rule (ruling 2026-07-28): no beat fully stops before the next
// begins — every move's tail overlaps the next move's head. Still one
// continuous take, no cuts: the highlights must visibly be the same object
// from call to topic.
//
// One paused master timeline, seeked by the player; geometry measured from the
// real app before this is built. See the motion-design / motion-teardown
// skills, and analyse-film.py for how each beat is verified.

/** Beat times in seconds. Principal hits sit on the 120bpm half-second grid;
 *  overlaps deliberately start off-grid, inside the previous beat. */
const T = {
  brandIn: 0.2,
  brandOut: 1.6,
  reveal: 1.85, // blur clears + the call scales up and centres, under the title's exit
  cursor: 2.4,
  punch: 2.9, // camera zooms while the cursor is still travelling
  click: 3.5,
  genie: 3.62,
  whip: 4.35, // the bar streaks in while the last ribbons are still pouring
  expand: 5.5,
  read: 6.1,
  approach: 7.0, // the topic starts forward from depth during the read
  pull: 8.0,
  handoff: 8.62,
  endBlur: 9.6,
  brandBack: 9.85,
  end: 12.0,
}

/** How big the card plays alone on screen — 1.3× its docked size. */
const HERO_SCALE = 1.15
/** It arrives larger and settles; the size change is most of what makes the
 *  arrival visible on a dark field. */
const WHIP_IN_SCALE = 1.32
/** The card enters from the right: the camera travels left→right. */
const WHIP_FROM = 980
/** Sits a little above centre — things read high in frame. */
const HERO_BIAS = 0.5
/** Punch-in before the click (zoom toward the point of interaction). */
const PUNCH = 1.12

/** Centre of Meet's hang-up button, in stage coordinates. */
const HANGUP = toStage(978, CHROME_H + 903)
/** Where the genie pours to: bottom edge, a little left of centre, like a
 *  Dock icon would sit. */
const DOCK = { x: STAGE_W * 0.42, y: STAGE_H + 40 }

export function Scenario1Layers({ links }: { links: Record<FrameId, FrameLink> }) {
  return (
    <>
      {/* Void: near-black with a faint fixed glow and grain, so it reads as a
          surface rather than an absence. No sweeps, no flares (ruling). */}
      <div className="absolute inset-0" style={{ backgroundColor: '#07080a' }}>
        <div
          data-layer="glow"
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

      {/* The topic sits under everything that must land on it. */}
      <PeekWindow frame={links.app} />

      {/* The call: one live window for the sharp beats, and its ribbon-sliced
          twin for the pour. They swap on a single frame, same pixels. */}
      <div data-layer="meet" className="absolute inset-0">
        <Window>
          <MeetCall />
        </Window>
      </div>
      <GenieMeet />

      <ClippedFrame frame={links.bar} />
      <ClippedFrame frame={links.card} />

      <BrandCard />
      <CursorArrow />

      {/* Directional blur: every camera move needs motion blur, and CSS blur()
          smears both axes, which reads as defocus rather than speed. */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <filter id="blur-genie" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur data-blur="genie" stdDeviation="0 0" />
        </filter>
        <filter id="blur-card" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur data-blur="card" stdDeviation="0 0" />
        </filter>
      </svg>
    </>
  )
}

/** What the timeline tweens. `render` is the only thing that writes it to the
 *  DOM — one writer per element is what makes the film scrubbable. */
interface State {
  scale: number
  revealH: number
  dockP: number
  offsetX: number
  squash: number
  pinch: number
  rot: number
  barOpacity: number
  cardOpacity: number
  lift: number
  blurX: number
  blurY: number
  genieP: number
}

/** The three elements of one clipped copy (see ClippedFrame). */
interface Copy {
  outer: HTMLElement
  clip: HTMLElement
  shadow: HTMLElement
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

export function buildScenario1(opts: {
  root: HTMLElement
  geometry: Geometry
  links: Record<FrameId, FrameLink>
}): { tl: gsap.core.Timeline; dispose: () => void } {
  const { root, geometry, links } = opts
  const q = gsap.utils.selector(root)
  const one = <T extends Element>(sel: string) => q(sel)[0] as unknown as T

  const copy = (id: 'bar' | 'card'): Copy => ({
    outer: one<HTMLElement>(`[data-clipped-outer="${id}"]`),
    clip: one<HTMLElement>(`[data-clipped-clip="${id}"]`),
    shadow: one<HTMLElement>(`[data-clipped-shadow="${id}"]`),
  })
  const bar = copy('bar')
  const cardCopy = copy('card')
  const blurCard = one<SVGElement>('[data-blur="card"]')
  const blurGenie = one<SVGElement>('[data-blur="genie"]')
  const meet = one<HTMLElement>('[data-layer="meet"]')
  const genie = one<HTMLElement>('[data-layer="genie"]')
  const strips = q('[data-genie-strip]') as HTMLElement[]
  const peek = one<HTMLElement>('[data-layer="peek"]')
  const cursor = one<HTMLElement>('[data-layer="cursor"]')
  const flash = one<HTMLElement>('[data-layer="click-flash"]')
  const brand = one<HTMLElement>('[data-layer="brand"]')
  const brandMark = one<HTMLElement>('[data-brand-mark]')
  const hangup = one<HTMLElement>('[data-hangup]')

  const split = SplitText.create(q('[data-brand-line]'), { type: 'words', mask: 'words' })

  const s: State = {
    scale: HERO_SCALE,
    revealH: geometry.collapsed.height,
    dockP: 0,
    offsetX: WHIP_FROM,
    squash: 1,
    pinch: 1,
    rot: 0,
    barOpacity: 0,
    cardOpacity: 0,
    lift: 0,
    blurX: 0,
    blurY: 0,
    genieP: 0,
  }

  /**
   * Place a clipped copy so the visible slice of its card — `revealH` tall,
   * measured from the card's top — sits where this beat wants it. `dockP`
   * blends from centre-of-frame to exactly where the app draws the card inside
   * its window, which is what makes the handoff invisible.
   *
   * The pull is not a straight line: mid-travel the card bows sideways on an
   * arc and leans into the direction of travel, both derived from dockP so the
   * deformation is a function of where it is, not a second animation that
   * could drift out of sync.
   */
  const place = (c: Copy, rect: Rect, revealH: number, opacity: number) => {
    const docked = toStage(rect.x, CHROME_H + rect.y)
    const heroSx = STAGE_W / 2 - s.scale * (rect.width / 2) + s.offsetX
    const heroSy = STAGE_H / 2 - s.scale * revealH * HERO_BIAS
    const scale = lerp(s.scale, WINDOW_SCALE, s.dockP)
    const bulge = Math.sin(s.dockP * Math.PI)
    const sx = lerp(heroSx, docked.x, s.dockP) - bulge * 26
    const sy = lerp(heroSy, docked.y, s.dockP)

    c.outer.style.transform = `translate(${sx - scale * rect.x}px, ${sy - scale * rect.y}px) scale(${scale})`
    c.outer.style.opacity = String(opacity)
    c.outer.style.filter = s.blurX > 0.05 || s.blurY > 0.05 ? 'url(#blur-card)' : 'none'

    c.clip.style.clipPath = `inset(${rect.y}px ${VIEW_W - (rect.x + rect.width)}px ${
      VIEW_H - (rect.y + revealH)
    }px ${rect.x}px round 8px)`
    // Deform about the card's own centre, not the frame's.
    const lean = s.rot + bulge * -1.3
    c.clip.style.transformOrigin = `${rect.x + rect.width / 2}px ${rect.y + revealH / 2}px`
    c.clip.style.transform = `rotate(${lean}deg) scaleX(${s.pinch}) scaleY(${s.squash})`

    const sh = c.shadow.style
    sh.left = `${rect.x}px`
    sh.top = `${rect.y}px`
    sh.width = `${rect.width}px`
    sh.height = `${revealH}px`
    sh.opacity = String(s.lift * opacity)
    sh.boxShadow = `0 ${10 + 26 * s.lift}px ${24 + 40 * s.lift}px rgba(0,0,0,${0.5 + 0.16 * s.lift})`
  }

  /** The pour. One driver value; each ribbon shapes it by its own delay —
   *  bottom leads, top trails — which is what bends the window into the
   *  genie funnel. At 0 the ribbons tile the live window exactly, so the
   *  swap between the two is invisible. */
  const renderGenie = () => {
    const g = s.genieP
    const pouring = g > 0.001 && g < 0.999
    genie.style.visibility = pouring ? 'visible' : 'hidden'
    meet.style.visibility = g > 0.001 ? 'hidden' : 'visible'
    if (!pouring) return
    let maxV = 0
    strips.forEach((el, i) => {
      const delay = ((GENIE_STRIPS - 1 - i) / (GENIE_STRIPS - 1)) * 0.45
      const p = clamp01((g - delay) / 0.55)
      const yc = GENIE_STRIP_H * (i + 0.5)
      const dy = Math.pow(p, 1.7) * (DOCK.y - yc)
      const sxRibbon = 1 - 0.96 * Math.pow(p, 1.1)
      el.style.transformOrigin = `${DOCK.x}px ${yc}px`
      el.style.transform = `translateY(${dy}px) scaleX(${sxRibbon})`
      el.style.opacity = String(1 - Math.max(0, (p - 0.88) / 0.12))
      maxV = Math.max(maxV, Math.sin(p * Math.PI))
    })
    blurGenie.setAttribute('stdDeviation', `0 ${maxV * 9}`)
  }

  const render = () => {
    // The bar copy always shows the whole collapsed card; the expanded copy
    // shows a growing slice of itself. Both use the same placement maths, so at
    // the swap — same revealH, same width — they are in exactly the same spot.
    place(bar, geometry.collapsed, geometry.collapsed.height, s.barOpacity)
    place(cardCopy, geometry.expanded, s.revealH, s.cardOpacity)
    if (s.blurX > 0.05 || s.blurY > 0.05) {
      blurCard.setAttribute('stdDeviation', `${s.blurX} ${s.blurY}`)
    }
    renderGenie()
  }

  const tipAt = (x: number, y: number) => ({ x: x - TIP_X, y: y - TIP_Y })

  /** The app's own card is revealed a beat BEFORE the floating copy goes,
   *  while the copy sits exactly on top of it: same pixels, so nothing can be
   *  seen. Derived from the playhead, so scrubbing backwards puts it back. */
  let sentCard: boolean | null = null
  const syncApp = (time: number) => {
    const visible = time >= T.handoff - 0.24
    if (visible === sentCard) return
    sentCard = visible
    links.app.send('set-card-visible', { visible })
  }

  const tl = gsap.timeline({ paused: true })

  // Driven by the ticker, not the timeline's onUpdate: seeking a timeline
  // suppresses its callbacks by default, so an onUpdate-driven render leaves
  // the frame stale everywhere the film is scrubbed rather than played.
  const frame = () => {
    render()
    syncApp(tl.time())
  }
  gsap.ticker.add(frame)

  // Frame 0: the call behind the title, blurred and dimmed, sitting slightly
  // small and low — it grows into place as the focus pulls. The meet layer
  // keeps ONE transform-origin (the hang-up point) for its whole life, so the
  // settle, the punch and the genie all compose without an origin jump.
  gsap.set(meet, {
    transformOrigin: `${HANGUP.x}px ${HANGUP.y}px`,
    scale: 0.95,
    y: 14,
    filter: 'blur(16px) brightness(0.55)',
  })
  gsap.set(genie, { scale: PUNCH, transformOrigin: `${HANGUP.x}px ${HANGUP.y}px` })
  gsap.set(peek, { opacity: 0, scale: 0.8, transformOrigin: '50% 46%', filter: 'blur(12px) brightness(0.5)' })
  gsap.set(cursor, { ...tipAt(1250, 1080), opacity: 0, scale: 1 })
  gsap.set(flash, { ...HANGUP, opacity: 0, scale: 0.5 })
  gsap.set(brand, { opacity: 0 })
  render()

  // ── Bookend, first pass: small, over the blurred call ──
  tl.to(brand, { opacity: 1, duration: 0.3, ease: 'power1.out' }, T.brandIn)
  tl.from(brandMark, { y: 12, opacity: 0, duration: 0.55, ease: 'back.out(1.4)' }, T.brandIn)
  tl.from(split.words, { yPercent: 118, duration: 0.6, ease: 'back.out(1.6)', stagger: 0.05 }, T.brandIn + 0.16)
  tl.addLabel('brandOut', T.brandOut)
  tl.to(brand, { opacity: 0, y: -10, duration: 0.45, ease: 'power2.inOut' }, T.brandOut)

  // ── Focus pull: the title is still dissolving as the call sharpens, grows
  //    a little, and settles into centre — arriving somewhere, not a layer
  //    switching off. ──
  tl.addLabel('reveal', T.reveal)
  tl.to(meet, { scale: 1, y: 0, duration: 0.75, ease: 'power2.out' }, T.reveal)
  tl.to(meet, { filter: 'blur(0px) brightness(1)', duration: 0.7, ease: 'power2.out' }, T.reveal)

  // ── The click. The cursor enters while the frame is still sharpening; the
  //    camera zooms toward the button while the cursor is still travelling. ──
  tl.addLabel('cursor', T.cursor)
  tl.to(cursor, { opacity: 1, duration: 0.16, ease: 'power1.out' }, T.cursor - 0.05)
  tl.to(
    cursor,
    {
      keyframes: [
        { ...tipAt(1130, 1005), duration: 0.42, ease: 'power2.inOut' },
        { ...tipAt(HANGUP.x + 9, HANGUP.y - 5), duration: 0.3, ease: 'power1.inOut' },
        { ...tipAt(HANGUP.x, HANGUP.y), duration: 0.16, ease: 'power2.out' },
      ],
    },
    T.cursor,
  )
  tl.addLabel('punch', T.punch)
  tl.to(meet, { scale: PUNCH, duration: 0.45, ease: 'power2.inOut' }, T.punch)
  tl.to(hangup, { filter: 'brightness(1.2)', duration: 0.12, ease: 'power1.out' }, T.click - 0.14)
  tl.addLabel('click', T.click)
  tl.to(cursor, { scale: 0.86, duration: 0.06, yoyo: true, repeat: 1, ease: 'power2.inOut' }, T.click)
  tl.to(hangup, { scale: 0.93, duration: 0.07, yoyo: true, repeat: 1, ease: 'power2.inOut' }, T.click + 0.02)
  tl.fromTo(
    flash,
    { opacity: 0.85, scale: 0.5 },
    { opacity: 0, scale: 2.1, duration: 0.4, ease: 'power2.out', immediateRender: false },
    T.click,
  )

  // ── The genie. The live window swaps for its ribbon twin on a single frame
  //    (same pixels), and the ribbons pour into the dock point — bottom first,
  //    the window necking into a funnel as it drains. ──
  tl.addLabel('genie', T.genie)
  tl.fromTo(
    s,
    { genieP: 0 },
    { genieP: 1, duration: 0.85, ease: 'power1.in', immediateRender: false },
    T.genie,
  )
  tl.to(cursor, { opacity: 0, duration: 0.2, ease: 'power1.in' }, T.genie + 0.15)

  // ── The highlights streak in while the last ribbons are still pouring:
  //    motion blur only, nothing else (ruling). ──
  tl.addLabel('whip', T.whip)
  tl.fromTo(
    s,
    { barOpacity: 0, lift: 0 },
    { barOpacity: 1, lift: 1, duration: 0.16, ease: 'power1.out', immediateRender: false },
    T.whip,
  )
  tl.fromTo(
    s,
    { offsetX: WHIP_FROM },
    {
      immediateRender: false,
      keyframes: [
        { offsetX: -24, duration: 0.42, ease: 'power4.inOut' },
        { offsetX: 0, duration: 0.14, ease: 'power2.out' },
      ],
    },
    T.whip,
  )
  tl.fromTo(
    s,
    { scale: WHIP_IN_SCALE },
    { scale: HERO_SCALE, duration: 0.6, ease: 'power3.out', immediateRender: false },
    T.whip,
  )
  tl.fromTo(
    s,
    { blurX: 0 },
    {
      immediateRender: false,
      keyframes: [
        { blurX: 16, duration: 0.18, ease: 'power2.in' },
        { blurX: 0, duration: 0.26, ease: 'power2.out' },
      ],
    },
    T.whip,
  )

  // ── Fast, playful open: copies swap on the frame the button label changes,
  //    the content sweeps in quickly, and the pop overshoots with the faintest
  //    tilt as it snaps back. ──
  tl.addLabel('expand', T.expand)
  tl.fromTo(
    s,
    { barOpacity: 1, cardOpacity: 0 },
    { barOpacity: 0, cardOpacity: 1, duration: 0.001, immediateRender: false },
    T.expand,
  )
  tl.fromTo(
    s,
    { revealH: geometry.collapsed.height },
    { revealH: geometry.expanded.height, duration: 0.3, ease: 'power2.out', immediateRender: false },
    T.expand,
  )
  tl.fromTo(
    s,
    { scale: HERO_SCALE * 0.94 },
    { scale: HERO_SCALE, duration: 0.5, ease: 'back.out(4)', immediateRender: false },
    T.expand,
  )
  tl.fromTo(
    s,
    { rot: 0 },
    {
      immediateRender: false,
      keyframes: [
        { rot: -1.0, duration: 0.1, ease: 'power2.out' },
        { rot: 0.5, duration: 0.14, ease: 'power1.inOut' },
        { rot: 0, duration: 0.2, ease: 'power2.out' },
      ],
    },
    T.expand,
  )

  // ── Read. And during the read, the topic approaches from depth: small,
  //    soft and dim far behind the card, coming forward — scale, focus and
  //    light on one shared curve, so it reads as one object approaching. ──
  tl.addLabel('read', T.read)
  tl.addLabel('approach', T.approach)
  tl.to(peek, { opacity: 1, duration: 0.25, ease: 'power1.out' }, T.approach)
  tl.to(peek, { scale: 1, filter: 'blur(0px) brightness(1)', duration: 0.9, ease: 'power2.out' }, T.approach)

  // ── The pull: sucked in, not carried. It accelerates, bows on an arc and
  //    leans into the travel (see place()), stretches like taffy mid-flight,
  //    then lands above the composer with a squash and snaps back square. ──
  tl.addLabel('pull', T.pull)
  tl.fromTo(
    s,
    { dockP: 0, lift: 1 },
    { dockP: 1, lift: 0, duration: 0.55, ease: 'power2.in', immediateRender: false },
    T.pull,
  )
  tl.fromTo(
    s,
    { squash: 1, pinch: 1 },
    {
      immediateRender: false,
      keyframes: [
        { squash: 1.06, pinch: 0.96, duration: 0.32, ease: 'power2.in' },
        { squash: 0.955, pinch: 1.02, duration: 0.1, ease: 'power1.in' },
        { squash: 1, pinch: 1, duration: 0.24, ease: 'back.out(2.5)' },
      ],
    },
    T.pull + 0.13,
  )
  tl.fromTo(
    s,
    { blurY: 0 },
    {
      immediateRender: false,
      keyframes: [
        { blurY: 7, duration: 0.3, ease: 'power2.in' },
        { blurY: 0, duration: 0.18, ease: 'power2.out' },
      ],
    },
    T.pull + 0.05,
  )
  tl.addLabel('handoff', T.handoff)
  tl.fromTo(s, { cardOpacity: 1 }, { cardOpacity: 0, duration: 0.06, immediateRender: false }, T.handoff)

  // ── Rest on the docked card, then the mirror: the topic sinks into exactly
  //    the opening's blur-and-dim, and the same small title returns. First
  //    frame: the call about to happen. Last frame: what it produced. ──
  tl.addLabel('endBlur', T.endBlur)
  tl.to(peek, { filter: 'blur(16px) brightness(0.55)', scale: 0.97, duration: 0.7, ease: 'power2.inOut' }, T.endBlur)
  tl.addLabel('brandBack', T.brandBack)
  tl.to(brand, { opacity: 1, y: 0, duration: 0.3, ease: 'power1.out' }, T.brandBack)
  // fromTo, not from: a second .from() on the same targets captures its end
  // values at build time, when the first .from() has already zeroed them —
  // the card would enter to an invisible state.
  tl.fromTo(
    brandMark,
    { y: 12, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.55, ease: 'back.out(1.4)', immediateRender: false },
    T.brandBack,
  )
  tl.fromTo(
    split.words,
    { yPercent: 118 },
    { yPercent: 0, duration: 0.6, ease: 'back.out(1.6)', stagger: 0.05, immediateRender: false },
    T.brandBack + 0.14,
  )
  tl.to({}, { duration: 0.1 }, T.end)

  // Tuning/verification handle: the animated state, readable frame by frame.
  ;(window as unknown as { __state?: State }).__state = s

  return {
    tl,
    dispose: () => {
      gsap.ticker.remove(frame)
      tl.kill()
      split.revert()
    },
  }
}
