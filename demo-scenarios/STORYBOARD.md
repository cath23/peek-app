# Nostr-for-Business demo — Scenario 1

Source for the story: the Linear doc
[Scenarios of Nostr for Business](https://linear.app/peek-app/document/scenarios-of-nostr-for-business-49287455c230).
Designs: Figma `Peek- Claude to Figma`, S1 board node 712-2933.
Craft rules: the `motion-design` and `motion-teardown` skills in `.claude/skills/`.

## Running it

Three servers. The app on 5173, and one per film version — **each version keeps
its own URL** so an earlier cut stays watchable (ruling 2026-07-28):

```
npx vite --port 5173                                    # the app
Set-Location demo-scenarios-v1; npx vite --port 5200    # v1, frozen
Set-Location demo-scenarios;    npx vite --port 5201    # v2, current
```

`?peek=http://host:port` points at a different app server; `?t=6.5` or
`?t=expand` deep-links a moment; `?autoplay=1` plays on load.

| Key | |
|---|---|
| Space | play / pause |
| → ← | next / previous beat |
| R | restart and play |
| H | hide the HUD (do this before recording) |
| G | GSDevTools — scrub and tune |

Rendered cuts live in `renders/` (gitignored). Render one with
`node demo-scenarios/render-film.mjs <outdir> 30`, which seeks the timeline frame by frame
and shoots each one — deterministic, exactly 30fps, no dropped frames — then
encode the sequence with ffmpeg. That's also what gets measured; see below.

## The film — 13.5s, 30fps, 120bpm, one continuous take

**No cuts, by ruling.** The point of the film is that the highlights you watch
leave the call are demonstrably the same object that lands in the topic; a cut
would break exactly the causality it exists to show. Where a move was invisible
the fix was contrast, not an edit.

```
00.0–02.0  THE TOPIC, WAITING. Empty, no highlights, nothing to read. The
           bookend card fades up over it — mark, name, one line, which doubles
           as the title and says what you're about to watch. Scrim behind the
           text only.
02.0–02.5  SWAP. The topic lifts away and the call comes up into the same
           space. One space, two things in it — not a cut.
02.5–03.4  THE CALL, holding.                                    [SFX room tone]
03.4–04.0  CURSOR arcs to the hang-up button, decelerating, small overshoot.
04.0–04.3  PUNCH-IN toward the button, 1.0→1.12.
04.5       CLICK. Cursor press, button press, and a ring expanding off it.
                                                                    [SFX click]
04.5–05.0  MINIMISE. Swells 1.5% then folds into the click point, y-blur.
           Deliberately calmer than the hero beats.           [SFX whoosh, -3f]
05.0–05.5  EMPTY VOID. 15 frames of nothing.
05.5–06.15 THE CAMERA TRAVELS RIGHT and finds the card. A light sweep crosses
           with it and the field brightens; the card arrives oversized and
           settles. Measured at 0.13 before that contrast existed — invisible.
                                                              [SFX whoosh, -3f]
06.15–07.0 HOLD on the collapsed bar: one line, "Expand".
07.0–07.75 SPRING OPEN. The two clipped copies swap on the frame the button
           label changes — which is what a click looks like. Reveal sweeps top
           to bottom; the bounce lives in scale.                 [SFX soft pop]
07.75–09.0 HOLD on the hero card. Four lines, readable.
09.0–09.55 THE TOPIC COMES BACK for it, rising from below.    [SFX whoosh, -3f]
09.5–10.05 THE CARD DOCKS into its slot, with a landing squash. The app's own
           card is revealed underneath 8 frames earlier — same pixels, so the
           swap can't be seen.                                      [SFX click]
10.5–10.9  A TEAMMATE PICKS IT UP. Greg's reply appears under the highlights
           and the camera leans in 3.5%. Its space is reserved from the start,
           so nothing shifts.                                      [SFX ping]
11.5–13.5  BOOKEND, SECOND PASS. The UI dips and defocuses, the same card
           returns — now reading as a result, not a promise. Holds 42 frames.
                                                                   [SFX riser]
```

**Sound is added in post** (the rig is silent). Whooshes peak 2–3 frames
*before* their move; clicks sit well under the music.

## Measured, not asserted

`demo-scenarios/analyse-film.py` reads the rendered mp4 and reports per-frame change against
the beat table above; `.claude/skills/motion-teardown/scripts/teardown.py`
gives the shot list and cut lengths. v2, measured:

| Beat | v1 | v2 | |
|---|---|---|---|
| whip | 0.13 | **1.10** | was classified a static hold — invisible |
| reply appears | — | **0.73** | 0.01 before the camera leaned in |
| minimise | 6.29 | 5.61 | pulled back; it shouldn't be the biggest thing |
| every HOLD | 0.00–0.06 | 0.00–0.09 | genuinely still |

Two things the metric can't see, worth knowing: it is area-weighted, so a
full-frame window move will always out-score a card-sized subject (the spring
and the dock sit at ~0.5 and that is fine); and the cursor is far too small to
register at all, which is why the click ring exists.

## How the Peek beats work

They embed the REAL app — three copies of it, all in demo mode (`?demo=1`, see
`src/demo/` in the app):

- **app** — the whole app in its browser window. Its highlights card is hidden
  until the handoff, so the topic reads as empty while the card is still
  arriving.
- **bar** — clipped to the COLLAPSED card. This is what the whip brings in.
- **card** — clipped to the EXPANDED card. This springs open and docks.

Two clipped copies rather than one that expands: the collapsed and expanded
layouts put the card in different places, so asking a frame to expand mid-beat
would show the wrong slice for a frame or two while the message crossed. Each
frame is put into its state once, before playback, and never touched again.

Nothing is a replica — it is the real card throughout, which is why the landing
is exact and why none of this rots when the component changes. Geometry comes
from the app over postMessage (`src/demo/demoBridge.ts`), measured before the
timeline is built: a timeline that awaits something mid-run can't be scrubbed
backwards.

The topic itself is **empty apart from the highlights** (ruling 2026-07-27) —
nobody has typed a word in it, so the first thing in it is what the call
produced. Its members come from the topic, not from message authors.

## Working rules

- Committed to the repo (ruling 2026-07-24), isolated from the app build —
  nothing in `src/` may import from `demo-scenarios/`.
- Third-party app scenes are hand-built pixel-perfect from Figma via the Figma
  MCP, verified by screenshot diff.
- Play the film hands-free rather than stepping it: keypress rhythm isn't
  repeatable and shows up as jitter between takes.
- No 9:16 cut (ruling 2026-07-27): a vertical crop keeps only the centre 576px
  of 1440, so the card can't be read at that width. A vertical version would
  need its own framing pass, not a crop.

## Scenario 2 — parked until S1 is filmed

Figma-app scene: canvas with payment-flow frames, Linear project widget,
feedback panel with staged typing and the "Asking Stripe sub-agent" beat.
