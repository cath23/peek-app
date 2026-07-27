---
name: motion-design
description: Craft rules for animating Peek — product-demo scenario films (demo-scenarios/) and in-product UI motion. Read before writing any timeline, transition, spring, or camera move.
---

# Motion design for Peek

Two very different jobs share this file. Know which one you are doing.

**Product motion** (inside `src/`) exists to explain state changes to someone
who has seen them a hundred times. It is short, quiet, and never asks to be
noticed: 120–220ms, single ease, no overshoot beyond a hair. A bouncy spring
in a message list is a toy.

**Scenario film motion** (inside `demo-scenarios/`) exists to make a stranger
understand and want the product in ten seconds. It is directed: it has
staging, camera, rhythm, and it may be playful. Everything below marked
**[film]** is for the film only and must never leak into `src/`.

## The rules that decide whether it looks professional

**Nothing starts when the previous thing finishes.** Overlap every beat by
10–25% of its duration. Dead air between moves is the single clearest tell of
amateur motion. In GSAP that means the position parameter, not `delay`:
`"<0.15"`, `"-=0.2"`, labels.

**One idea in motion at a time.** If two things must move together, one leads
and the other supports — different durations, different eases, offset starts.
Two elements moving identically read as a slideshow.

**Ease is the meaning.** `power2.out` = something arriving under its own
control. `power4.inOut` = a camera. `power2.in` = something leaving, or
gravity taking it. `back.out(1.6)` = it snapped into place. Linear = a
machine, and reads as broken unless it is literally a machine (a progress
bar, a scanline).

**Real things arc and settle.** A cursor never travels in a straight line and
never stops dead: curve the path, decelerate, and let it drift 4–8px past the
target before settling. Same for anything a hand would move.

**Overshoot belongs to scale, not to silhouette.** [film] If an element is a
window onto other content (a clip-path, a mask, a cropped iframe), springing
its edges past the target exposes what is behind it for a few frames. Put the
bounce in a uniform `scale` and let the edge ease cleanly to its mark.

**Squash on impact, 1–2%, never more.** [film] When something lands, a
`scaleY: 0.985` for ~90ms sells weight. At 5% it becomes a cartoon.

**A camera move needs two layers.** [film] One object flying in reads as an
object flying in. Move a backdrop, glow, or vignette at a different rate and
the same tween reads as the camera moving instead. Parallax is what makes it
a camera.

**Fast pans want directional blur.** [film] A whip pan without blur reads
mechanical. Use an SVG filter with asymmetric blur —
`<feGaussianBlur stdDeviation="8 0">` — tweened 0 → peak → 0 across the move.
CSS `blur()` is isotropic and smears vertically, which looks like a mistake.

**Text scaling is allowed exactly once:** when the whole object is being
presented as a hero. Keep it under 8% or the type visibly softens.

## Timing vocabulary

| Move | Duration | Ease |
|---|---|---|
| Product state change (`src/`) | 120–220ms | `power2.out` |
| Element enters frame [film] | 600–900ms | `power3.out` |
| Element leaves frame [film] | 400–550ms | `power2.in` |
| Camera push / pull [film] | 800–1000ms | `power3.inOut` or a custom curve |
| Whip pan [film] | 450–550ms | `power4.inOut` |
| Spring / pop [film] | 500–650ms | `back.out(1.6–2.2)` |
| Landing snap [film] | 160–200ms | `back.out(3)` |
| Title reveal per word [film] | 700–900ms, 50–70ms stagger | `power3.out` |
| Slow final drift [film] | 1200–1600ms | `power1.inOut` |

Hold beats matter as much as moves. After a reveal, hold 600–900ms before the
next thing — the viewer needs time to read what just arrived.

## The rig (demo-scenarios/)

One paused GSAP master timeline with `addLabel()` per beat. The player seeks
it; it never plays itself in response to a keypress. That buys three things:
identical takes every recording, `?t=` deep links into any moment, and
GSDevTools scrubbing while tuning.

**Measure, never guess.** The film embeds the real app in an iframe. Geometry
comes from the app over postMessage (`src/demo/demoBridge.ts`) — the card's
real rect, collapsed and expanded — and the timeline is built from those
numbers. Nothing is hardcoded to a layout, so the film survives UI changes.

**Calibrate before playback, not during.** Any async work (expanding a card to
measure it, waiting for fonts) happens before the timeline is built. A
timeline that awaits something mid-run cannot be scrubbed backwards.

**Sync DOM state from the playhead, idempotently.** State the app holds (a
card being expanded) must be derived from current time in `onUpdate`, not
toggled by a one-shot callback — otherwise scrubbing backwards leaves the app
in the wrong state.

**Pixel-identical handoffs.** When a hand-animated element must become a real
app element, make both the same pixels — the same app in a second iframe,
positioned identically — and crossfade over ~60ms while both are at rest. A
replica that merely looks similar will pop, and it rots the first time the
component changes.

**Keep the app out of it.** `src/` may never import from `demo-scenarios/`,
and film-only behaviour lives behind demo mode. If a beat seems to need a
product change, animate the camera instead.

## Recording

The stage is a fixed 1440×1024, scaled to the window; `?hud=0` or `H` hides
the HUD. Play the timeline hands-free rather than stepping — keypress rhythm
is not repeatable and shows up as jitter between takes. Check the result at
1:1 as well as scaled down; blur and shadow choices that read well at 50%
often look mushy full size.
