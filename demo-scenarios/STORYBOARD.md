# Nostr-for-Business demo — Scenario 1

Source for the story: the Linear doc
[Scenarios of Nostr for Business](https://linear.app/peek-app/document/scenarios-of-nostr-for-business-49287455c230).
Designs: Figma `Peek- Claude to Figma`, S1 board node 712-2933.
Craft rules: the `motion-design` and `motion-teardown` skills in `.claude/skills/`.

## Running it

Two dev servers — the player needs both:

```
npx vite --port 5173                       # the app, from the repo root
Set-Location demo-scenarios; npx vite --port 5200
```

Then http://localhost:5200. `?peek=http://host:port` points at a different app
server; `?t=6.5` or `?t=expand` deep-links a moment; `?autoplay=1` plays on load.

| Key | |
|---|---|
| Space | play / pause |
| → ← | next / previous beat |
| R | restart and play |
| H | hide the HUD (do this before recording) |
| G | GSDevTools — scrub and tune |

Playback waits until all three embedded app frames have reported their
geometry, so a slow dev-server compile can never be caught on film.

## The film — 12.5s, 30fps, 120bpm

Every beat lands on a 0.5s marker (one beat; 15 frames). Cuts that don't sit on
the grid are what "feels off but looks fine" means.

```
00.0–02.5  MEET, COLD OPEN. The call is already live — no logo, no build-up.
           Window inset to 88%, rounded, soft shadow on the void.
   00.3–01.3  TITLE over the call, dimmed to 58%: "Scenario 01" /
              "Highlights in Huddle". 3 words, 50ms stagger, mask reveal +
              blur 7→0, back.out(1.6). UI holds still — text and UI take turns.
   01.3–02.0  HOLD. Nothing moves.
   02.0–02.35 Title out: fade + 10px down (exit ≈ 60% of the entry). Dim lifts.
02.5–03.0  CURSOR in from bottom-right, arcs to the hang-up button. 15f,
           decelerating, 7px overshoot before it settles.
03.0–03.27 PUNCH-IN toward the button, 1.0→1.12, 8f — the most reliable beat
           in the genre. Then hold.
03.5       CLICK. Cursor press 2f, button press + brightness 2f.      [SFX click]
03.5–04.0  MINIMISE. Swells 2% for 2f (anticipation), then collapses into the
           click point, 13f power2.in, y-blur 0→14, opacity out over the last
           5f.                                                [SFX whoosh, −3f]
04.0–04.5  EMPTY VOID. 15f of nothing. The pause is the tension.
04.5–05.0  WHIP left→right. The collapsed card enters from the right, 12f
           power4.inOut + 3f settle, x-blur 0→14→0, glow parallax at a slower
           rate — one object alone reads as an object, two layers at different
           rates read as a camera.                            [SFX whoosh, −3f]
05.0–06.0  HOLD 30f. The bar alone on the void: one line, "Expand".
06.0–06.6  SPRING OPEN. The two clipped copies swap in a single frame, on the
           frame the button label changes — which is what a click looks like.
           Reveal 12f power3.out; the bounce lives in scale, back.out(2.6) 18f.
                                                                 [SFX soft pop]
06.6–08.0  HOLD 45f. The hero card, dead still. Reading time.
08.0–08.53 PEEK RISES. y+150→0, 0.94→1, 16f back.out(1.15), y-blur 0→6→0.
                                                              [SFX whoosh, −3f]
08.5–09.0  CARD DOCKS. 15f power3.inOut into its slot in the topic; landing
           squash 2f + settle 4f back.out(2.5). The app's own card is revealed
           8f earlier underneath — same pixels, so the swap can't be seen.
                                                                  [SFX click]
09.0–10.5  HOLD 45f. The topic with the card in it. Nothing moves.
10.5–12.5  END CARD. UI dips to 18% + 9px blur, Peek mark + one line, mask
           reveal, hold 45f. Music resolves on the final frame.    [SFX riser]
```

Shot lengths: 3.0 / 1.0 / 1.0 / 1.0 / 2.0 / 1.0 / 1.5 / 2.0 — average 1.7s,
inside the 1.5–3s target.

**Sound is added in post** (the rig is silent). Whooshes peak 2–3 frames
*before* their move; clicks sit well under the music; the riser carries into
the end card.

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
