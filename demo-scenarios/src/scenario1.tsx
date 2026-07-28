import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { MeetCall } from './scenes/MeetCall'
import { BrandCard } from './scenes/BrandCard'
import { CursorArrow, TIP_X, TIP_Y } from './scenes/CursorArrow'
import { PeekWindow } from './scenes/PeekWindow'
import { ClippedFrame } from './scenes/ClippedFrame'
import { Window } from './scenes/Window'
import { CHROME_H, STAGE_H, STAGE_W, VIEW_H, VIEW_W, WINDOW_SCALE, toStage } from './lib/stage'
import type { FrameId, FrameLink, Geometry, Rect } from './lib/frames'

gsap.registerPlugin(SplitText)

// ── Scenario 1 — "Highlights land in the topic" ──
//
// One continuous take, no cuts (ruling 2026-07-28). The whole point is that the
// highlights you watch leave the call are demonstrably the same object that
// lands in the topic — a cut would break exactly the causality the film exists
// to show. Where a move was invisible the answer was to give it contrast, not
// to cut away from it.
//
// The topic waits, empty → into the call → the call ends → the highlights it
// produced, alone on screen, springing open → the topic comes back for them →
// a teammate picks the work up.
//
// 13.5s at 120bpm: every beat lands on a 0.5s marker. One paused master
// timeline, seeked by the player; all geometry measured from the real app
// before this is built. See the motion-design and motion-teardown skills.

/** Beat times in seconds — all multiples of 0.5 (one beat at 120bpm). */
const T = {
  brandIn: 0.25,
  brandOut: 1.75,
  swap: 2.0,
  callHold: 2.5,
  cursor: 3.5,
  punch: 4.0,
  click: 4.5,
  minimize: 4.5,
  void: 5.0,
  whip: 5.5,
  expand: 7.0,
  peekBack: 9.0,
  dock: 9.5,
  handoff: 10.0,
  reply: 10.5,
  endcard: 11.5,
  end: 13.5,
}

/** How big the card plays alone on screen — 1.3× its docked size. */
const HERO_SCALE = 1.15
/** It arrives larger and settles: the size change is most of what makes the
 *  arrival visible on a dark field. */
const WHIP_IN_SCALE = 1.34
/** The card enters from the right: the camera travels left→right. */
const WHIP_FROM = 980
/** Sits a little above centre — things read high in frame. */
const HERO_BIAS = 0.52
/** Punch-in before the click (zoom toward the point of interaction). */
const PUNCH = 1.12

/** Centre of Meet's hang-up button, in stage coordinates. */
const HANGUP = toStage(978, CHROME_H + 903)

export function Scenario1Layers({ links }: { links: Record<FrameId, FrameLink> }) {
  return (
    <>
      {/* Void: near-black, with grain so it reads as a surface rather than an
          absence, and a glow that brightens and sweeps on the whip. One object
          moving alone reads as an object; the field moving with it reads as a
          camera. */}
      <div className="absolute inset-0" style={{ backgroundColor: '#07080a' }}>
        <div
          data-layer="glow"
          className="absolute inset-0"
          style={{
            opacity: 0.22,
            background:
              'radial-gradient(1000px 560px at 50% 46%, rgba(86,200,255,0.42), rgba(86,200,255,0.10) 45%, transparent 72%)',
          }}
        />
        {/* A hard light sweep that crosses with the camera. The soft glow alone
            measured as nothing: too low an amplitude over too large an area to
            change the frame. This is the part the eye actually registers. */}
        <div
          data-layer="sweep"
          style={{
            position: 'absolute',
            top: -120,
            bottom: -120,
            left: 0,
            width: 560,
            opacity: 0,
            transform: 'skewX(-12deg)',
            background:
              'linear-gradient(90deg, transparent, rgba(150,205,255,0.16) 42%, rgba(220,240,255,0.22) 52%, rgba(150,205,255,0.14) 62%, transparent)',
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

      {/* Peek sits under the floating copies: the card has to land on top of
          the app's own card for the handoff. */}
      <PeekWindow frame={links.app} />
      <ClippedFrame frame={links.bar} />
      <ClippedFrame frame={links.card} />

      <div data-layer="meet" className="absolute inset-0" style={{ opacity: 0 }}>
        <Window>
          <MeetCall />
        </Window>
      </div>

      <BrandCard />
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
  const peek = one<HTMLElement>('[data-layer="peek"]')
  const cursor = one<HTMLElement>('[data-layer="cursor"]')
  const flash = one<HTMLElement>('[data-layer="click-flash"]')
  const glow = one<HTMLElement>('[data-layer="glow"]')
  const sweep = one<HTMLElement>('[data-layer="sweep"]')
  const brand = one<HTMLElement>('[data-layer="brand"]')
  const brandBlock = one<HTMLElement>('[data-brand-block]')
  const brandMark = one<HTMLElement>('[data-brand-mark]')
  const hangup = one<HTMLElement>('[data-hangup]')

  const split = SplitText.create(q('[data-brand-line]'), { type: 'words', mask: 'words' })

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
   * blends from centre-of-frame to exactly where the app draws the card inside
   * its window, which is what makes the handoff invisible.
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

    // Shadow under the card, plus a cool halo while it floats: the card is dark
    // on a dark field, and without separation its arrival doesn't register.
    const sh = c.shadow.style
    sh.left = `${rect.x}px`
    sh.top = `${rect.y}px`
    sh.width = `${rect.width}px`
    sh.height = `${revealH}px`
    sh.opacity = String(s.lift * opacity)
    sh.boxShadow =
      `0 ${10 + 26 * s.lift}px ${24 + 40 * s.lift}px rgba(0,0,0,${0.5 + 0.16 * s.lift}), ` +
      `0 0 ${60 * s.lift}px rgba(120,180,255,${0.12 * s.lift})`
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
   * State the app holds, derived from the playhead rather than fired as
   * one-shots, so scrubbing backwards puts it back. The card is revealed a beat
   * BEFORE the floating copy goes, while the copy sits exactly on top of it:
   * same pixels, so nothing can be seen, and a late message can't leave a gap.
   */
  let sentCard: boolean | null = null
  let sentReply: boolean | null = null
  const syncApp = (time: number) => {
    const cardVisible = time >= T.handoff - 0.27
    if (cardVisible !== sentCard) {
      sentCard = cardVisible
      links.app.send('set-card-visible', { visible: cardVisible })
    }
    const replyVisible = time >= T.reply
    if (replyVisible !== sentReply) {
      sentReply = replyVisible
      links.app.send('set-reply-visible', { visible: replyVisible })
    }
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

  // Frame 0: the topic, empty, waiting. No dim, no movement — the first
  // impression is the product, not a fade.
  gsap.set(meet, { transformOrigin: `${HANGUP.x}px ${HANGUP.y}px`, opacity: 0, y: 150, scale: 0.955 })
  gsap.set(peek, { opacity: 1, y: 0, scale: 1 })
  gsap.set(cursor, { ...tipAt(1240, 1075), opacity: 0, scale: 1 })
  gsap.set(flash, { ...HANGUP, opacity: 0, scale: 0.5 })
  gsap.set(brand, { opacity: 0 })
  render()

  // ── Bookend, first pass: over the waiting topic ──
  tl.to(brand, { opacity: 1, duration: 0.3, ease: 'power1.out' }, T.brandIn)
  tl.from(brandMark, { y: 16, opacity: 0, duration: 0.6, ease: 'back.out(1.4)' }, T.brandIn)
  tl.from(split.words, { yPercent: 118, duration: 0.7, ease: 'back.out(1.6)', stagger: 0.05 }, T.brandIn + 0.18)
  tl.fromTo(
    brandBlock,
    { filter: 'blur(7px)' },
    { filter: 'blur(0px)', duration: 0.75, ease: 'power2.out' },
    T.brandIn + 0.12,
  )
  tl.addLabel('brandOut', T.brandOut)
  tl.to(brand, { opacity: 0, y: -12, duration: 0.3, ease: 'power2.in' }, T.brandOut)

  // ── The topic goes away and the call comes up in its place ──
  // A vertical swap rather than a cut: the same space, two things in it.
  tl.addLabel('swap', T.swap)
  tl.to(peek, { y: -220, scale: 0.955, opacity: 0, duration: 0.5, ease: 'power2.inOut' }, T.swap)
  tl.to(meet, { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'power2.out' }, T.swap + 0.06)

  // ── The call is ended ──
  tl.addLabel('cursor', T.cursor)
  tl.to(cursor, { opacity: 1, duration: 0.16, ease: 'power1.out' }, T.cursor - 0.1)
  // Hands arc, and overshoot slightly before settling. A straight line at
  // constant speed is the clearest tell that a cursor is fake.
  tl.to(
    cursor,
    {
      keyframes: [
        { ...tipAt(1120, 1000), duration: 0.24, ease: 'power2.in' },
        { ...tipAt(HANGUP.x + 9, HANGUP.y - 5), duration: 0.16, ease: 'power1.inOut' },
        { ...tipAt(HANGUP.x, HANGUP.y), duration: 0.1, ease: 'power2.out' },
      ],
    },
    T.cursor,
  )
  tl.addLabel('punch', T.punch)
  tl.to(meet, { scale: PUNCH, duration: 0.27, ease: 'power2.out' }, T.punch)
  tl.to(hangup, { filter: 'brightness(1.2)', duration: 0.12, ease: 'power1.out' }, T.click - 0.15)
  tl.addLabel('click', T.click)
  tl.to(cursor, { scale: 0.86, duration: 0.06, yoyo: true, repeat: 1, ease: 'power2.inOut' }, T.click)
  tl.to(hangup, { scale: 0.93, duration: 0.07, yoyo: true, repeat: 1, ease: 'power2.inOut' }, T.click + 0.02)
  tl.fromTo(
    flash,
    { opacity: 0.85, scale: 0.5 },
    { opacity: 0, scale: 2.1, duration: 0.42, ease: 'power2.out', immediateRender: false },
    T.click,
  )

  // ── The window folds away into the click ──
  // Deliberately calmer than it was: the biggest event in the film shouldn't be
  // someone else's window leaving.
  tl.addLabel('minimize', T.minimize)
  tl.to(
    meet,
    {
      keyframes: [
        { scale: PUNCH * 1.015, duration: 0.05, ease: 'power1.out' },
        { scale: 0.42, y: 120, x: -90, duration: 0.4, ease: 'power2.in' },
      ],
    },
    T.minimize + 0.05,
  )
  tl.to(meet, { opacity: 0, duration: 0.26, ease: 'power2.in' }, T.minimize + 0.24)
  tl.fromTo(
    one<SVGElement>('[data-blur="meet"]'),
    { attr: { stdDeviation: '0 0' } },
    { attr: { stdDeviation: '0 10' }, duration: 0.36, ease: 'power2.in', immediateRender: false },
    T.minimize + 0.05,
  )
  tl.fromTo(
    meet,
    { filter: 'url(#blur-meet)' },
    { filter: 'url(#blur-meet)', duration: 0.5, immediateRender: false },
    T.minimize,
  )
  tl.to(cursor, { opacity: 0, duration: 0.18, ease: 'power1.in' }, T.minimize + 0.1)

  // ── Empty void: 15 frames of nothing. The pause is the tension. ──
  tl.addLabel('void', T.void)

  // ── The camera travels right and finds the card ──
  // Measured at 0.13 mean change in the last cut — invisible. The fix isn't a
  // cut, it's contrast: the field brightens and sweeps, and the card arrives
  // oversized and settles, so the frame genuinely changes.
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
        { offsetX: -26, duration: 0.4, ease: 'power4.inOut' },
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
  tl.fromTo(
    glow,
    { x: 520, opacity: 0.22 },
    {
      immediateRender: false,
      keyframes: [
        { x: 120, opacity: 0.85, duration: 0.34, ease: 'power3.out' },
        { x: 0, opacity: 0.42, duration: 0.5, ease: 'power2.inOut' },
      ],
    },
    T.whip,
  )
  tl.fromTo(
    sweep,
    { x: STAGE_W + 200, opacity: 0 },
    {
      immediateRender: false,
      keyframes: [
        { opacity: 1, duration: 0.08, ease: 'none' },
        { x: -700, duration: 0.34, ease: 'power2.inOut' },
        { opacity: 0, duration: 0.12, ease: 'power2.out' },
      ],
    },
    T.whip - 0.06,
  )

  // ── Hold 45 frames on the bar, then spring open ──
  // The two copies swap in a single frame, on the frame the button label
  // changes — which is exactly what a click looks like. The reveal sweeps the
  // content in top to bottom; the bounce lives in scale, because springing the
  // clip past its mark would expose the app behind it.
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
    { revealH: geometry.expanded.height, duration: 0.5, ease: 'power2.out', immediateRender: false },
    T.expand,
  )
  tl.fromTo(
    s,
    { scale: HERO_SCALE * 0.93 },
    { scale: HERO_SCALE, duration: 0.72, ease: 'back.out(3.2)', immediateRender: false },
    T.expand,
  )
  tl.to(glow, { opacity: 0.6, duration: 0.3, ease: 'power2.out' }, T.expand)
  tl.to(glow, { opacity: 0.34, duration: 0.9, ease: 'power2.inOut' }, T.expand + 0.35)

  // ── The topic comes back for it ──
  tl.addLabel('peekBack', T.peekBack)
  tl.to(peek, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.2)' }, T.peekBack)
  tl.fromTo(
    peek,
    { filter: 'url(#blur-peek)' },
    { filter: 'url(#blur-peek)', duration: 0.55, immediateRender: false },
    T.peekBack,
  )
  tl.fromTo(
    one<SVGElement>('[data-blur="peek"]'),
    { attr: { stdDeviation: '0 0' } },
    {
      immediateRender: false,
      keyframes: [
        { attr: { stdDeviation: '0 7' }, duration: 0.2, ease: 'power2.in' },
        { attr: { stdDeviation: '0 0' }, duration: 0.3, ease: 'power2.out' },
      ],
    },
    T.peekBack,
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
        { blurY: 6, duration: 0.18, ease: 'power2.in' },
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
        { squash: 0.982, duration: 0.08 },
        { squash: 1, duration: 0.15, ease: 'back.out(2.6)' },
      ],
    },
    T.dock + 0.42,
  )
  tl.addLabel('handoff', T.handoff)
  tl.fromTo(s, { cardOpacity: 1 }, { cardOpacity: 0, duration: 0.06, immediateRender: false }, T.handoff)

  // ── Someone picks the work up out of it ──
  // A message arriving is a small event in a big frame — measured at 0.01, it
  // was invisible. The camera leans in on it, which both registers and says
  // where to look.
  tl.addLabel('reply', T.reply)
  tl.to(peek, { scale: 1.035, duration: 0.45, ease: 'power2.out' }, T.reply - 0.06)

  // ── Bookend, second pass: the same words over the finished topic ──
  tl.addLabel('endcard', T.endcard)
  tl.to(peek, { opacity: 0.2, filter: 'blur(7px)', scale: 1.09, duration: 0.55, ease: 'power2.inOut' }, T.endcard)
  tl.to(brand, { opacity: 1, y: 0, duration: 0.3, ease: 'power1.out' }, T.endcard + 0.1)
  tl.from(brandMark, { y: 14, opacity: 0, duration: 0.55, ease: 'back.out(1.4)' }, T.endcard + 0.1)
  tl.from(split.words, { yPercent: 118, duration: 0.6, ease: 'back.out(1.5)', stagger: 0.05 }, T.endcard + 0.24)
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
