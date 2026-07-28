# Nostr-for-Business demo — Scenarios 1 & 2

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
Set-Location demo-scenarios;    npx vite --port 5203    # scenario 2 (open /scenario2.html)
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
For delivery quality set `SCALE=2` (renders at 2880×2048 device pixels — crisp
text) and encode with `-crf 13 -preset slow`; 1× / crf 16 is fine for the
measurement loop.

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

## Scenario 2 — "The answer just shows up" (~15.2s, one orchestrated take)

Story (Linear doc, scenario 2, 2026-07-25 revision — **no Stripe**, ruling
2026-07-29): the designer finishes the payment-flow draft in Figma and asks
the AI for feedback; Figma AI calls a **Linear sub-agent** for relevant
customer feedback; the reply surfaces three feedback items as widgets and
leaves three comments on the canvas; the opened comment leads with a Linear
feedback widget and says what to change. Design source: the user's mock,
Figma `761:1286` (canvas + chrome + AI panel; feedback widgets and the opened
thread are designed to the widget family's tokens).

Run it: `Set-Location demo-scenarios; npx vite --port 5203` →
`http://localhost:5203/scenario2.html`. Same keys/params as S1. No embedded
app — every pixel is hand-built, so it waits only for fonts.

```
00.0–01.6  BOOKEND. Peek mark + "The answer just shows up." over the Figma
           canvas, blurred and dimmed. Identical treatment to S1 (ruling).
01.6–02.6  FOCUS PULL. The canvas sharpens, grows ~5%, settles into centre —
           payment-flow drafts, the Linear project widget, the designer's
           sticky note: "which decline reasons? 3DS declined state??"
                                                        [SFX room tone up]
02.5–03.6  THE ASK. Cursor arcs to the AI panel's input WHILE the camera
           punches toward the panel (Z 1.6, framed to hold panel + drafts).
                                                              [SFX click]
03.6–05.35 TYPING. The ask types on in one quick confident burst with two
           micro-hitches; the input grows a line; caret live.  [SFX keys]
05.35–5.95 SEND. Cursor hops to send, ring off the button, the ask becomes
           the bubble on the frame the input clears.       [SFX soft pop]
05.95–7.35 THE SUB-AGENT. "Asking Linear sub-agent for relevant customer
           feedback…" shimmers twice; the camera drifts in a breath — the
           ecosystem moment, given air.               [SFX low shimmer]
07.35–8.5  THE ANSWER. Three Linear feedback widgets cascade into the reply,
           then: "I've left 3 comments on the canvas."   [SFX 3 soft ticks]
08.5–09.0  Modal read hold — dead still.
09.0–10.3  OUT OF THE CHAT. The camera pulls wide WHILE the panel slips
           away and three pins pop onto the drafts, left to right, ending
           by the sticky note.                  [SFX whoosh + pop-pop-pop]
10.05–11.1 THE BLOOM. Punch into the sticky-note corner while the last pin
           settles; the comment blooms out of its pin: the 3DS feedback
           widget + what to change.                        [SFX bloom]
11.15–12.75 DOCKED READ. 1.6s dead still — the reading time (ruling).
12.75–15.2 MIRROR. The canvas sinks into the opening blur; the same card
           returns. First frame: a draft with a question stuck to it. Last:
           the answer, placed on the design.        [SFX riser, resolve]
```

Craft notes: the camera is a real rig here (x/y/zoom on one wrapper,
`transformOrigin 0 0`) because the film has two punch-in targets — framings
are computed from geometry (`camTarget`), never hand-tuned; the panel framing
is left-biased so no frame ever shows void past the window edge. The AI
panel's whole conversation exists in the DOM from frame 0 and the timeline
reveals it in order — typed text derives from one `typeP` state (whole
characters only), so scrubbing backwards un-types the ask. The hero pin
deviates from the mock (ruling): it sits by the sticky note so the final
zoom lands on the answer to the handwritten question.

Measured (v1, `analyse-film.py <mp4> s2`): punch-in mean 2.87 / peak 10.5;
pull-out + pins 3.50 / 11.7; punch + bloom 4.33 / 11.7; mirror 2.83 / 10.8;
every hold and both reads exactly 0.00. The typing / send / cascade beats
measure ≤0.13 by design — text-scale subjects on a dark panel are invisible
to the area-weighted metric (same caveat as S1's cursor); verified visually
frame-by-frame instead.
