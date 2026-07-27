import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { MeetCall } from './scenes/MeetCall'
import { TitleCard } from './scenes/TitleCard'
import { EndCard } from './scenes/EndCard'
import { CursorArrow, TIP_X, TIP_Y } from './scenes/CursorArrow'
import { PeekWindow } from './scenes/PeekWindow'
import { ClippedFrame } from './scenes/ClippedFrame'
import { Window } from './scenes/Window'
import { CHROME_H, STAGE_H, STAGE_W, VIEW_H, VIEW_W, WINDOW_SCALE, toStage } from './lib/stage'
import type { FrameId, FrameLink, Geometry, Rect } from './lib/frames'

gsap.registerPlugin(SplitText)

// ── Scenario 1 — "Highlights in Huddle" ──
//
// Cold open on the call → it ends and the window minimises away → the
// highlights card alone on screen, springing open → Peek rises around it and
// takes the card as the topic's first message → end card.
//
// 12.5s at 120bpm: every beat lands on a 0.5s marker, because cuts that don't
// sit on the grid are what "feels off but looks fine" means. One paused master
// timeline, seeked by the player. Geometry is measured from the real app before
// this is built, so nothing is pinned to a layout. See the motion-design and
// motion-teardown skills.

/** Beat times in seconds — all multiples of 0.5 (one beat at 120bpm). */
const T = {
  titleIn: 0.3,
  titleOut: 2.0,
  cursorIn: 2.5,
  punch: 3.0,
  click: 3.5,
  minimize: 3.5,
  void: 4.0,
  whip: 4.5,
  expand: 6.0,
  peek: 8.0,
  dock: 8.5,
  handoff: 9.0,
  endcard: 10.5,
  end: 12.5,
}

/** How big the card plays when it is alone on screen — 1.3× its docked size,
 *  so the push-in reads without the expanded card outgrowing the frame. */
const HERO_SCALE = 1.15
/** The card enters from the right: the camera travels left→right. */
const WHIP_FROM = 940
/** Sits a little above centre — things read high in frame. */
const HERO_BIAS = 0.52
/** Punch-in before the click (recipes: zoom toward the point of interaction). */
const PUNCH = 1.12

/** Centre of Meet's hang-up button, in stage coordinates. */
const HANGUP = toStage(978, CHROME_H + 903)

export function Scenario1Layers({ links }: { links: Record<FrameId, FrameLink> }) {
  return (
    <>
      {/* Void: a near-black field with a soft glow that pans on the whip. One
          object moving alone reads as an object; two layers moving at
          different rates read as a camera. */}
      <div className="absolute inset-0" style={{ backgroundColor: '#07080a' }}>
        <div
          data-layer="glow"
          className="absolute inset-0"
          style={{
            opacity: 0.22,
            background:
              'radial-gradient(1100px 620px at 50% 46%, rgba(86,200,255,0.13), rgba(86,200,255,0.03) 45%, transparent 72%)',
          }}
        />
      </div>

      {/* Peek sits under the floating copies: the card has to land on top of
          the app's own card for the handoff. */}
      <PeekWindow frame={links.app} />
      <ClippedFrame frame={links.bar} />
      <ClippedFrame frame={links.card} />

      <div data-layer="meet" className="absolute inset-0">
        <Window>
          <MeetCall />
          {/* Dims the call while the title is on it — text and UI take turns. */}
          <div data-meet-dim className="absolute inset-0" style={{ backgroundColor: '#000', opacity: 0 }} />
        </Window>
      </div>

      <TitleCard width={STAGE_W} height={STAGE_H} />
      <EndCard />
      <CursorArrow />

      {/* Directional blur: every camera move needs motion blur, and CSS blur()
          smears both axes, which reads as defocus rather than speed. */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <filter id="blur-meet" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur data-blur="meet" stdDeviation="0 0" />
        </filter>
        <filter id="blur-peek" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur data-blur="peek" stdDeviation="0 0" />
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
  barOpacity: number
  cardOpacity: number
  lift: number
  blurX: number
  blurY: number
}

/** The three elements of one clipped copy (see ClippedFrame). */
interface Copy {
  outer: HTMLElement
  clip: HTMLElement
  shadow: HTMLElement
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

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
  const meet = one<HTMLElement>('[data-layer="meet"]')
  const meetDim = one<HTMLElement>('[data-meet-dim]')
  const peek = one<HTMLElement>('[data-layer="peek"]')
  const cursor = one<HTMLElement>('[data-layer="cursor"]')
  const glow = one<HTMLElement>('[data-layer="glow"]')
  const titleBlock = one<HTMLElement>('[data-title-block]')
  const titleNum = one<HTMLElement>('[data-title-num]')
  const endCard = one<HTMLElement>('[data-layer="endcard"]')
  const endMark = one<HTMLElement>('[data-endcard-mark]')
  const endLine = one<HTMLElement>('[data-endcard-line]')
  const hangup = one<HTMLElement>('[data-hangup]')

  const split = SplitText.create(q('[data-title-line]'), { type: 'words', mask: 'words' })

  const s: State = {
    scale: HERO_SCALE,
    revealH: geometry.collapsed.height,
    dockP: 0,
    offsetX: WHIP_FROM,
    squash: 1,
    barOpacity: 0,
    cardOpacity: 0,
    lift: 0,
    blurX: 0,
    blurY: 0,
  }

  /**
   * Place a clipped copy so the visible slice of its card — `revealH` tall,
   * measured from the card's top — sits where this beat wants it. `dockP`
   * blends from centre-of-frame at HERO_SCALE to exactly where the app draws
   * the card inside its inset window, which is what makes the handoff
   * invisible.
   */
  const place = (c: Copy, rect: Rect, revealH: number, opacity: number) => {
    const docked = toStage(rect.x, CHROME_H + rect.y)
    const heroSx = STAGE_W / 2 - s.scale * (rect.width / 2) + s.offsetX
    const heroSy = STAGE_H / 2 - s.scale * revealH * HERO_BIAS
    const scale = lerp(s.scale, WINDOW_SCALE, s.dockP)
    const sx = lerp(heroSx, docked.x, s.dockP)
    const sy = lerp(heroSy, docked.y, s.dockP)

    c.outer.style.transform = `translate(${sx - scale * rect.x}px, ${sy - scale * rect.y}px) scale(${scale})`
    c.outer.style.opacity = String(opacity)
    c.outer.style.filter = s.blurX > 0.05 || s.blurY > 0.05 ? 'url(#blur-card)' : 'none'

    c.clip.style.clipPath = `inset(${rect.y}px ${VIEW_W - (rect.x + rect.width)}px ${
      VIEW_H - (rect.y + revealH)
    }px ${rect.x}px round 8px)`
    // Squash about the card's own centre, not the frame's.
    c.clip.style.transformOrigin = `${rect.x + rect.width / 2}px ${rect.y + revealH / 2}px`
    c.clip.style.transform = `scaleY(${s.squash})`

    const sh = c.shadow.style
    sh.left = `${rect.x}px`
    sh.top = `${rect.y}px`
    sh.width = `${rect.width}px`
    sh.height = `${revealH}px`
    sh.opacity = String(s.lift * opacity)
    sh.boxShadow = `0 ${10 + 26 * s.lift}px ${24 + 40 * s.lift}px rgba(0,0,0,${0.5 + 0.16 * s.lift})`
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
  }

  const tipAt = (x: number, y: number) => ({ x: x - TIP_X, y: y - TIP_Y })

  /**
   * The app's own card is revealed a beat BEFORE the floating copy goes, while
   * the copy is still sitting exactly on top of it: same pixels, so nothing can
   * be seen, and a late message can't leave a gap. Derived from the playhead
   * rather than fired as a one-shot, so scrubbing backwards puts it back.
   */
  let sentVisible: boolean | null = null
  const syncCard = (time: number) => {
    const visible = time >= T.handoff - 0.27
    if (visible === sentVisible) return
    sentVisible = visible
    links.app.send('set-card-visible', { visible })
  }

  const tl = gsap.timeline({ paused: true })

  // Driven by the ticker, not the timeline's onUpdate: seeking a timeline
  // suppresses its callbacks by default, so an onUpdate-driven render leaves
  // the frame stale everywhere the film is scrubbed rather than played.
  const frame = () => {
    render()
    syncCard(tl.time())
  }
  gsap.ticker.add(frame)

  // Cold open: the call is already on screen at frame 0 (recipes §1 — no logo,
  // no build-up, straight into the UI).
  gsap.set(meet, { transformOrigin: `${HANGUP.x}px ${HANGUP.y}px`, opacity: 1 })
  gsap.set(peek, { opacity: 0, y: 150, scale: 0.94 })
  gsap.set(cursor, { ...tipAt(1240, 1075), opacity: 0 })
  gsap.set(endCard, { opacity: 0 })
  render()

  // ── Title, over the live call ──
  tl.to(meetDim, { opacity: 0.58, duration: 0.4, ease: 'power2.out' }, T.titleIn - 0.15)
  tl.from(titleNum, { opacity: 0, y: 10, letterSpacing: '0.7em', duration: 0.7, ease: 'power2.out' }, T.titleIn)
  tl.from(
    split.words,
    { yPercent: 118, duration: 0.75, ease: 'back.out(1.6)', stagger: 0.05 },
    T.titleIn + 0.1,
  )
  tl.fromTo(
    titleBlock,
    { filter: 'blur(7px)' },
    { filter: 'blur(0px)', duration: 0.8, ease: 'power2.out' },
    T.titleIn + 0.08,
  )
  // Exit at 60–70% of the entry, and the call comes back up underneath.
  tl.addLabel('titleOut', T.titleOut)
  tl.to(titleBlock, { y: 10, opacity: 0, duration: 0.35, ease: 'power2.in' }, T.titleOut)
  tl.to(meetDim, { opacity: 0, duration: 0.35, ease: 'power2.out' }, T.titleOut)

  // ── The call is ended ──
  tl.addLabel('cursor', T.cursorIn)
  tl.to(cursor, { opacity: 1, duration: 0.18, ease: 'power1.out' }, T.cursorIn)
  // Hands arc, and overshoot slightly before settling. A straight line at
  // constant speed is the clearest tell that a cursor is fake.
  tl.to(
    cursor,
    {
      keyframes: [
        { ...tipAt(1120, 1000), duration: 0.24, ease: 'power1.out' },
        { ...tipAt(HANGUP.x + 7, HANGUP.y - 4), duration: 0.16, ease: 'power1.inOut' },
        { ...tipAt(HANGUP.x, HANGUP.y), duration: 0.1, ease: 'power2.out' },
      ],
    },
    T.cursorIn,
  )
  // Punch in toward the button before the click lands — the most reliable beat
  // in the genre (recipes §2).
  tl.addLabel('punch', T.punch)
  tl.to(meet, { scale: PUNCH, duration: 0.27, ease: 'power2.out' }, T.punch)
  tl.to(hangup, { filter: 'brightness(1.18)', duration: 0.12, ease: 'power1.out' }, T.click - 0.15)
  tl.addLabel('click', T.click)
  tl.to(cursor, { scale: 0.88, duration: 0.06, yoyo: true, repeat: 1, ease: 'power2.inOut' }, T.click)
  tl.to(hangup, { scale: 0.93, duration: 0.07, yoyo: true, repeat: 1, ease: 'power2.inOut' }, T.click + 0.02)

  // ── The window folds away into the click ──
  tl.addLabel('minimize', T.minimize)
  // A breath of anticipation — it swells a hair before it goes, which is what
  // makes the collapse read as an action rather than a fade.
  tl.to(
    meet,
    {
      keyframes: [
        { scale: PUNCH * 1.02, duration: 0.06, ease: 'power1.out' },
        { scale: 0.05, y: 90, x: -120, duration: 0.44, ease: 'power2.in' },
      ],
    },
    T.minimize,
  )
  tl.to(meet, { opacity: 0, duration: 0.16, ease: 'power1.in' }, T.minimize + 0.34)
  tl.fromTo(
    meet,
    { filter: 'url(#blur-meet)' },
    { filter: 'url(#blur-meet)', duration: 0.5, immediateRender: false },
    T.minimize,
  )
  tl.fromTo(
    one<SVGElement>('[data-blur="meet"]'),
    { attr: { stdDeviation: '0 0' } },
    { attr: { stdDeviation: '0 14' }, duration: 0.4, ease: 'power2.in', immediateRender: false },
    T.minimize,
  )
  tl.to(cursor, { opacity: 0, duration: 0.2, ease: 'power1.in' }, T.minimize + 0.05)
  tl.to(glow, { opacity: 0.5, duration: 0.7, ease: 'power2.out' }, T.minimize + 0.1)

  // ── Empty void: 15 frames of nothing. The pause is the tension. ──
  tl.addLabel('void', T.void)

  // ── Whip right, the collapsed card alone on screen ──
  // Every tween on `s` declares its start value and defers rendering: several
  // share the object, so inferred starts would depend on build order.
  tl.addLabel('whip', T.whip)
  tl.fromTo(
    s,
    { barOpacity: 0, lift: 0 },
    { barOpacity: 1, lift: 1, duration: 0.18, ease: 'power1.out', immediateRender: false },
    T.whip,
  )
  tl.fromTo(
    s,
    { offsetX: WHIP_FROM },
    {
      immediateRender: false,
      keyframes: [
        { offsetX: -20, duration: 0.4, ease: 'power4.inOut' },
        { offsetX: 0, duration: 0.1, ease: 'power2.out' },
      ],
    },
    T.whip,
  )
  tl.fromTo(
    s,
    { blurX: 0 },
    {
      immediateRender: false,
      keyframes: [
        { blurX: 14, duration: 0.18, ease: 'power2.in' },
        { blurX: 0, duration: 0.24, ease: 'power2.out' },
      ],
    },
    T.whip,
  )
  tl.fromTo(glow, { x: 340 }, { x: 0, duration: 0.6, ease: 'power3.inOut', immediateRender: false }, T.whip)

  // ── Hold 30 frames on the bar, then spring open ──
  // The two copies swap in a single frame, on the frame where the button label
  // changes — which is exactly what a click looks like. The reveal then eases
  // cleanly to the card's real height while the bounce lives in scale:
  // springing the clip past its mark would expose the app behind it.
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
    { revealH: geometry.expanded.height, duration: 0.4, ease: 'power3.out', immediateRender: false },
    T.expand,
  )
  tl.fromTo(
    s,
    { scale: HERO_SCALE * 0.965 },
    { scale: HERO_SCALE, duration: 0.6, ease: 'back.out(2.6)', immediateRender: false },
    T.expand,
  )

  // ── Hold 45 frames on the hero card, then Peek rises and takes it ──
  tl.addLabel('peek', T.peek)
  tl.to(peek, { opacity: 1, y: 0, scale: 1, duration: 0.53, ease: 'back.out(1.15)' }, T.peek)
  tl.fromTo(
    peek,
    { filter: 'url(#blur-peek)' },
    { filter: 'url(#blur-peek)', duration: 0.53, immediateRender: false },
    T.peek,
  )
  tl.fromTo(
    one<SVGElement>('[data-blur="peek"]'),
    { attr: { stdDeviation: '0 0' } },
    {
      immediateRender: false,
      keyframes: [
        { attr: { stdDeviation: '0 6' }, duration: 0.18, ease: 'power2.in' },
        { attr: { stdDeviation: '0 0' }, duration: 0.3, ease: 'power2.out' },
      ],
    },
    T.peek,
  )

  tl.addLabel('dock', T.dock)
  tl.fromTo(
    s,
    { dockP: 0, lift: 1 },
    { dockP: 1, lift: 0, duration: 0.5, ease: 'power3.inOut', immediateRender: false },
    T.dock,
  )
  tl.fromTo(
    s,
    { blurY: 0 },
    {
      immediateRender: false,
      keyframes: [
        { blurY: 5, duration: 0.18, ease: 'power2.in' },
        { blurY: 0, duration: 0.22, ease: 'power2.out' },
      ],
    },
    T.dock,
  )
  tl.fromTo(
    s,
    { squash: 1 },
    {
      immediateRender: false,
      keyframes: [
        { squash: 0.984, duration: 0.08 },
        { squash: 1, duration: 0.14, ease: 'back.out(2.5)' },
      ],
    },
    T.dock + 0.42,
  )
  tl.addLabel('handoff', T.handoff)
  tl.fromTo(s, { cardOpacity: 1 }, { cardOpacity: 0, duration: 0.06, immediateRender: false }, T.handoff)

  // ── Hold 45 frames dead still, then the end card ──
  tl.addLabel('endcard', T.endcard)
  tl.to(peek, { opacity: 0.18, filter: 'blur(9px)', duration: 0.5, ease: 'power2.inOut' }, T.endcard)
  tl.to(endCard, { opacity: 1, duration: 0.3, ease: 'power1.out' }, T.endcard + 0.1)
  tl.from(endMark, { y: 14, opacity: 0, duration: 0.55, ease: 'back.out(1.4)' }, T.endcard + 0.1)
  tl.from(endLine, { y: 10, opacity: 0, duration: 0.5, ease: 'power2.out' }, T.endcard + 0.25)
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
