---
name: motion-teardown
description: Analyze reference product/launch videos frame-by-frame and spec new ones. Use this skill whenever the user mentions product videos, launch videos, demo reels, promo videos, screen recordings, motion design, kinetic typography, transitions, shot lists, pacing, or wants to reverse-engineer, break down, or imitate the look of a video from a company like Linear, Vercel, Raycast, Framer, or Apple. Also use when the user uploads a video file and asks why it works, how it was made, or how to replicate it, and when they ask for a shot list, timing sheet, or storyboard for a UI-driven video. Trigger even if they don't use the words "teardown" or "motion design".
---

# Motion Teardown

For analyzing and specifying short, UI-driven product videos — the Linear/Vercel/Apple
genre: screen recordings plus motion design, usually 15–40 seconds, often no voiceover.

## The one thing to be honest about

You cannot watch video. You cannot perceive motion, easing, or rhythm by playing a file.

What you *can* do is measure it. `scripts/teardown.py` converts a video into things you
can actually work with: exact shot durations in frames, cut positions, per-shot motion
intensity, and extracted still frames you can view. Measurement plus stills gets you
most of what watching would give you — and it's more precise about timing than a human
eye, which cannot reliably count a 9-frame transition.

Never guess at timings or claim to have watched something. Measure, or ask the user.

## Workflow A — tearing down a reference video

When the user has a video file (uploaded, or downloaded to disk):

```bash
python3 scripts/teardown.py VIDEO --outdir teardown_out
```

Options: `--threshold` (default 0.25; lower to ~0.15 to catch soft dissolves,
raise to ~0.4 if it over-splits on busy motion), `--burst` (frames extracted
each side of a cut, default 6).

Then:

1. **Read `teardown_out/timing.md`** — shot list with durations in seconds and frames,
   cut times, and motion intensity per shot.
2. **View `teardown_out/shots/*.jpg`** — one frame per shot. Use these to read
   composition, type treatment, color, and how much of the frame the UI occupies.
3. **View `teardown_out/cuts/*.jpg`** when transition length matters. Each cut has a
   burst of frames named `m06 … m01, p01 … p06` (minus/plus N frames). Step through
   them: if the image changes completely between two adjacent frames it's a hard cut;
   if intermediate frames are blended or blurred, count how many and that's the
   transition length.
4. **Report findings as a spec**, not prose. The user wants numbers they can reproduce.

If the user has only a URL, do not attempt to download it — ask them to save the file
and upload it, or offer Workflow C instead.

## Workflow B — speccing a new video

Produce a timing sheet the user can build from directly. Always in this shape:

```
TOTAL: 22s | 30fps | 16:9 (+ 9:16 crop) | Track: [name], 120bpm, beats every 0.5s

00.0–00.6  HARD IN. UI already on screen, mid-zoom settle. No logo.
00.6–02.0  TEXT: "Instant search" — 3 words, stagger 40ms/word, overshoot ease
           UI holds static underneath.
02.0–05.5  INTERACTION 1: click search. Zoom 1.0→1.6 over 10 frames, ease-out
           overshoot. HOLD 2s. Zoom back over 8 frames.
           SFX: soft click on interaction, whoosh on each zoom.
...
19.0–22.0  END CARD: logo + name + one line. Music resolves. Hold 1.5s.
```

Rules for the spec:
- Every move gets a **duration in frames**, not vague words.
- Every cut gets a **beat position** relative to the track.
- Mark which layer each element belongs to: screen capture / motion design / generated.
- One idea per shot. If a shot can't be described in three words, split it.

## Workflow C — no file available

If there's no video to measure, do not invent numbers. Instead:
- Ask the user to run the teardown themselves and paste `timing.md` back.
- Or ask them to screenshot key frames and paste them — stills you *can* read.
- Or work from the principles in `references/recipes.md` and produce a spec that the
  user validates against the reference by eye.

## Core craft principles

The full library is in `references/recipes.md`. Load it when speccing a video or
explaining why something works. The short version:

- **Hold–move–hold.** The camera sits still, moves decisively, sits still. Continuous
  drift reads as amateur.
- **Overshoot easing on everything.** Nothing moves linearly. Slight overshoot and
  settle is the single biggest difference between "PowerPoint" and "Apple".
- **Motion blur on every move.** Non-negotiable.
- **1.5–3s per shot.** One idea each.
- **Stagger groups** by 30–60ms per element. Cheapest way to look expensive.
- **Text and UI take turns.** Never animate both in the same moment.
- **Cut on the beat.** Choose music first, then place cuts.
- **Speed-ramp the boring parts** (typing, loading) to 300–800%.
- **Sound design on every transition.** Mute a pro video and it collapses.
- **Never open on a logo animation.**
- **Assume it's watched on mute.**

## Interpreting the numbers

| Reading | Means |
|---|---|
| Avg shot length > 4s | Too slow for this genre; recommend cutting |
| Avg shot length 1.5–3s | On target |
| Motion "static hold" | A deliberate hold — good, these should alternate with moves |
| All shots "active motion" | Nothing ever rests; the eye has nowhere to land |
| Cut spans 1 frame | Hard cut |
| Cut spans 6–16 frames | Dissolve, whip, or covered transition |
| Cut spans > 20 frames | A slow blend — rare in this genre |

## Tool routing

When the user asks what to build with, keep the three layers distinct:

- **Capture (real UI pixels):** Screen Studio, Matte, Screen Charm (Mac); Rapidemo
  (Windows). Auto-zoom on click, cursor smoothing, motion blur.
- **Motion design (the actual "reel" feel):** Jitter for most cases, After Effects
  when Jitter's ceiling is hit. Kinetic type, easing, staggering, precise timing.
- **Generated elements (atmosphere only):** Higgsfield/Veo/Kling/Runway for covering
  transitions, backdrops, and bookend shots.

**Never route real UI through a generative model.** It re-renders the interface and
warps text and layout. Generated material sits around or behind the UI, never on top
of re-rendering it. If the user wants generated elements, spec them as separate
overlay layers composited in the editor.

AI demo-video tools (Trupeer, Clueso, Guidde) are a different genre — narrated
walkthroughs, not launch films. Recommend them when the user wants clarity and volume,
not when they want the Linear aesthetic.
