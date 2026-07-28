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

## The film, v3 — ~11.1s, 30fps, one orchestrated take

**No cuts (ruling):** the highlights must visibly be the same object from call
to topic. **And no beat fully stops before the next begins (ruling):** every
move's tail overlaps the next move's head — measured, the film moves
continuously from the pop to the landing.

```
00.0–01.6  BOOKEND. Small Peek mark + name + "Highlights land in the topic."
           over the CALL, blurred and dimmed. No scrim — the blur carries it.
01.6–02.6  FOCUS PULL. The title dissolves upward while the call sharpens,
           brightens, grows ~5% and settles into centre.    [SFX room tone up]
02.4–03.5  THE CLICK. Cursor in while the frame still sharpens, arcs to the
           hang-up button; the camera pushes to 1.12 WHILE it travels; button
           brightens; press + expanding ring.                      [SFX click]
03.6–04.55 THE GENIE. The window swaps for its ribbon twin on one frame (same
           pixels) and pours into a dock point — bottom ribbons lead, the
           window necks into a funnel, and each ribbon SWAYS sideways by its
           own progress, drawing the genie S-curve down the column. Motion
           blur scales with pour speed.                    [SFX genie whoosh]
04.35–5.0  THE HIGHLIGHTS STREAK IN while the last ribbons are still pouring —
           motion blur only, oversized arrival settling to hero size.
                                                            [SFX whoosh, −3f]
05.0–05.5  HOLD on the bar. One line, "Expand".
05.5–06.1  POP. Copies swap on the frame the label changes; content sweeps in
           over 9f; back.out(4) overshoot with a ±1° tilt.      [SFX soft pop]
05.85–6.5  CONVERGE. The topic approaches from depth WHILE the card creeps
           toward it — both moving at once, meeting in the middle. Scale +
           focus + light on one shared curve behind the pin-sharp card.
                                                               [SFX low rise]
06.5–07.0  THE COMMIT. The card accelerates out of its creep, bows on an arc,
           leans ~1.3° into the travel, stretches like taffy — lands directly
           above the compose box, with the squash, just as the topic finishes
           sharpening. The app's own card is revealed 2–3 frames before the
           copy fades, underneath, invisible.               [SFX snap-thunk]
07.2–08.6  DOCKED READ. 1.4s dead still on the landed card — the reading time
           lives here, in the app (ruling: read after placement).
08.6–11.1  MIRROR. The topic sinks into exactly the opening's blur-and-dim
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
| cursor + punch | 1.54 | 6.62 | the punch registers |
| genie pour | 3.68 | 10.39 | the showpiece; one 22-frame run with the sway |
| bar streaks in | 1.57 | 10.39 | inside the pour's tail — true overlap |
| pop open | 0.52 | 1.07 | card-sized subject; area-weighted metric |
| converge (approach+creep) | 0.62 | 0.90 | both moving at once, one 18-frame run |
| commit + land | 0.69 | 1.32 | continuous into the landing |
| docked READ | 0.00 | — | 1.4s dead still — the reading time |
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
