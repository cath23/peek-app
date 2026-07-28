# Nostr-for-Business demo — Scenario 1

Source for the story: the Linear doc
[Scenarios of Nostr for Business](https://linear.app/peek-app/document/scenarios-of-nostr-for-business-49287455c230).
Designs: Figma `Peek- Claude to Figma`, S1 board node 712-2933.
Craft rules: the `motion-design` and `motion-teardown` skills in `.claude/skills/`.

## Running it

The app on 5173, and one server per film version — **each version keeps its own
URL** so an earlier cut stays watchable (ruling 2026-07-28):

```
npx vite --port 5173                                    # the app
Set-Location demo-scenarios-v1; npx vite --port 5200    # v1, frozen
Set-Location demo-scenarios-v2; npx vite --port 5201    # v2, frozen
Set-Location demo-scenarios;    npx vite --port 5202    # v3, current
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
`node demo-scenarios/render-film.mjs <outdir> 30` — it seeks the timeline frame
by frame and shoots each one (deterministic, exactly 30fps), then encode the
sequence with ffmpeg (`npm i --no-save ffmpeg-static @ffprobe-installer/ffprobe`).

The frozen snapshots share the live app on 5173, so app-side demo-data changes
can drift what they show; each version's **rendered mp4 in `renders/` is its
authoritative record**.

## The film, v3 — ~12.1s, 30fps, one orchestrated take

**No cuts (ruling):** the highlights must visibly be the same object from call
to topic. **And no beat fully stops before the next begins (ruling):** every
move's tail overlaps the next move's head.

```
00.0–01.6  BOOKEND. Small Peek mark + name + "Highlights land in the topic."
           over the CALL, blurred and dimmed. No scrim — the blur carries it.
01.6–02.6  FOCUS PULL. The title dissolves upward while the call sharpens,
           brightens, grows ~5% and settles into centre — arriving, not
           switching on.                                    [SFX room tone up]
02.4–03.5  THE CLICK. Cursor in while the frame still sharpens, arcs to the
           hang-up button; the camera pushes to 1.12 WHILE it travels; button
           brightens; press + expanding ring.                      [SFX click]
03.6–04.5  THE GENIE. The window swaps for its ribbon twin on one frame (same
           pixels) and pours into a dock point at the bottom — bottom ribbons
           lead, the window necks into a funnel, vertical motion blur scales
           with pour speed.                                [SFX genie whoosh]
04.35–5.0  THE HIGHLIGHTS STREAK IN while the last ribbons are still pouring —
           motion blur only, oversized arrival settling to hero size.
                                                            [SFX whoosh, −3f]
05.0–05.5  HOLD on the bar. One line, "Expand".
05.5–06.1  POP. Copies swap on the frame the label changes; content sweeps in
           over 9f; the card overshoots with back.out(4) and a ±1° tilt as it
           snaps back. Fast and cheeky.                         [SFX soft pop]
06.1–07.0  READ. Dead still. Four lines.
07.0–07.95 THE TOPIC APPROACHES FROM DEPTH, during the read: small, soft and
           dim far behind the card, coming forward — scale, focus and light on
           one shared curve, so it reads as one object approaching, not three
           effects. The card stays pin-sharp in front.         [SFX low rise]
08.0–08.8  THE JELLY PULL. The card is sucked into the topic: accelerating,
           bowing on an arc, leaning ~1.3° into the travel, stretching like
           taffy mid-flight — then lands directly above the compose box with
           a squash and snaps back square. Handoff to the app's own card 7f
           earlier, underneath, invisible.                  [SFX snap-thunk]
08.8–09.6  REST on the docked card. Nothing else appears (ruling: no reply).
09.6–12.1  MIRROR. The topic sinks into exactly the opening's blur-and-dim
           and the same small title returns, same size, same position. First
           frame: the call about to happen. Last frame: what it produced.
                                                        [SFX riser, resolve]
```

**Sound is added in post** (the rig is silent). Whooshes peak 2–3 frames
*before* their move.

## Measured, not asserted

`demo-scenarios/analyse-film.py` reads a rendered mp4 and reports per-frame
change against the beat table. v3:

| Beat | mean | peak | |
|---|---|---|---|
| focus pull | 0.74 | 1.85 | visible arrival |
| cursor + punch | 1.54 | 6.61 | the punch registers |
| genie pour | 3.89 | 10.71 | the showpiece — biggest event by design |
| bar streaks in | 0.77 | 6.60 | overlaps the pour's tail (runs 3.77–4.43 and 4.35→) |
| pop open | 0.45 | 1.07 | card-sized subject; area-weighted metric |
| topic from depth | 0.30 | 0.59 | sustained approach, 28 frames |
| jelly pull | 0.53 | 1.30 | with landing spike |
| every HOLD | 0.00 | — | genuinely still |

The metric is area-weighted: full-frame moves always out-score card-sized
subjects, and the cursor is too small to register at all — the click ring and
the punch carry that beat.

## How the Peek beats work

The film embeds the REAL app — three copies, all in demo mode (`?demo=1`, see
`src/demo/` in the app):

- **app** — the whole app in its browser window; its highlights card hidden
  until the handoff, so the topic reads as empty while the card is arriving.
- **bar** — clipped to the COLLAPSED card (the streak-in).
- **card** — clipped to the EXPANDED card (the pop and the pull).

Two clipped copies rather than one that expands: the collapsed and expanded
layouts put the card in different places, so expanding a frame mid-beat would
show the wrong slice while the message crossed. Each frame holds one state for
the whole film. Nothing is a replica — it is the real card throughout, which
is why the landing is exact and why none of this rots when the component
changes. Geometry comes from the app over postMessage (`src/demo/demoBridge.ts`),
measured before the timeline is built.

The genie is the same idea applied to Meet: the window is rendered 28 times,
each copy clipped to one horizontal ribbon; at rest the ribbons tile the
original exactly, so the live window and its sliced twin swap on one frame
invisibly. The pour bends the ribbons toward the dock point, bottom first.

The topic contains **nothing but the highlights** (ruling): it docks at the
bottom of the stream, directly above the compose box, and nothing appears
after it.

## Working rules

- Committed to the repo, isolated from the app build — nothing in `src/` may
  import from `demo-scenarios/`.
- Third-party app scenes are hand-built pixel-perfect from Figma via the Figma
  MCP, verified by screenshot diff.
- Play the film hands-free rather than stepping it; keypress rhythm isn't
  repeatable.
- No 9:16 cut (ruling): a vertical crop keeps only the centre 576px of 1440.

## Scenario 2 — parked until S1 is signed off

Figma-app scene: canvas with payment-flow frames, Linear project widget,
feedback panel with staged typing and the "Asking Stripe sub-agent" beat.
