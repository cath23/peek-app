# Recipe library

Patterns observed across short UI-driven launch videos. Load when speccing a video
or explaining why a reference works.

**Contents**
1. Macro structures
2. Camera
3. Typography
4. Transitions
5. Timing and rhythm
6. Sound
7. Composition
8. Failure modes

---

## 1. Macro structures

**Cold open.** No setup, no logo. Straight into the UI doing the new thing; text names
the feature; cut. Most common and most confident. Default choice.

**Tension → release.** 2s of the annoying old way, then the new way. Use when the
feature solves a felt pain. Risk: showing the bad thing too long.

**Feature stack.** 4–6 rapid vignettes, one per capability, unified by music and a
consistent type treatment. For larger releases. Each vignette 2–3s max.

All three resolve the same way: everything settles, logo + name + one line, hold ~1.5s.

**Length targets.** 15–25s for a single feature. 30–45s for a release with several
parts. Past 60s this genre stops working — that's a demo video, different rules.

---

## 2. Camera

**Hold–move–hold.** The fundamental unit. Rest, decisive reposition, rest. The move
should be fast (8–14 frames) and the holds long (1–2s). Amateur work inverts this:
slow continuous drift with no rest.

**Zoom ranges.** 1.0→1.4 for gentle emphasis, 1.0→1.8 for "look at this specific
thing", beyond 2.0 only if the UI is genuinely dense. Always zoom *toward* the point
of interaction, not the center of frame.

**Punch-in on click.** The most reliable beat in the genre: cursor arrives, click
happens, camera punches in on the result within 2–3 frames. Screen recorders like
Screen Studio automate exactly this.

**Motion blur.** Every camera move needs it. Its absence is the main reason raw OBS
captures look cheap and Screen Studio output looks produced.

**Never** move the camera and animate significant UI content simultaneously unless the
move is very slow. The eye can only track one.

---

## 3. Typography

**Word count.** 2–5 words per card. If it needs a sentence, it needs a different shot.

**Stagger.** Animate by word or by line, 30–60ms between elements. Never all at once.
For a 3-word card at 40ms stagger the full entry takes ~0.3s plus the per-word
animation.

**Entry patterns**, roughly in order of how often they appear:
- Fade + rise 8–16px, overshoot ease
- Mask reveal (text wipes up from behind an invisible edge)
- Blur-in (blur 8px→0 with a slight scale from 1.05)
- Per-character for short words only; it gets busy past ~8 characters

**Exit.** Usually faster than entry — 60–70% of the entry duration. Often just a fade
or a downward slide, rarely mirroring the entry exactly.

**Hold time.** Text needs ~0.6s of stillness after landing before anything else moves.
Reading time is roughly 0.3s per word plus 0.3s.

**Placement.** Either centered on a clean background between UI shots, or anchored
consistently (same corner, same margin) when overlaid on UI. Inconsistent placement
across cards is a common tell.

---

## 4. Transitions

**Hard cut.** One frame. The default. Most transitions in this genre are hard cuts on
the beat — the fancy ones are the exception, not the rule.

**Whip / covered transition.** 6–12 frames. Motion-blurred sweep that covers the edit.
The covering element can be generated separately and composited.

**Match cut.** Same element in the same screen position across the cut, so the UI
appears to transform rather than change. Highest-effort, highest-impact.

**Dissolve.** 8–16 frames. Rarer here than in film; reads as slow. Use for "time
passing" or settling into an end card.

**Morph.** UI element scales/moves into the position of an element in the next shot.
Needs planning at capture time — you must record both shots with the element in
compatible positions.

**Rule:** transition style should be consistent within a video. Mixing whips,
dissolves, and morphs randomly reads as a tool demo rather than a design decision.

---

## 5. Timing and rhythm

**Pick music first.** Then place markers on beats, then place cuts on markers. Videos
that feel "off" almost always have good footage cut off-rhythm.

**Beat math.** At 120bpm a beat is 0.5s, a bar is 2s. Shots that are 1, 2, or 4 beats
long feel intentional. Shots of 1.7s do not.

**Speed ramps.** Typing, loading, scrolling, long navigations: 300–800%, then snap to
100% at the payoff frame. The snap-back is what sells it.

**Acceleration across the video.** Many good examples shorten shots as they progress —
3s early, 1.5s late — building energy before the end card resolves.

**The end card holds longest.** 1.5–2.5s of stillness. After all that motion the rest
is what makes it feel finished.

---

## 6. Sound

Most underrated layer. Mute a professional example and it collapses.

- **Whoosh** on each camera move and covered transition. Should peak *slightly before*
  the visual move, by 2–3 frames.
- **Click / tick** on each UI interaction. Quiet — well under the music.
- **Riser** into the end card.
- **Music resolves** on the final frame. Don't fade out mid-phrase.

Because most viewers watch on mute, sound is an enhancement, never load-bearing for
meaning. The visual must carry the message alone.

---

## 7. Composition

**UI occupies 60–80% of frame** in hero shots, with generous margin. Full-bleed
screenshots feel cramped; too small and the detail is unreadable on mobile.

**Backgrounds.** Solid brand color, subtle gradient, or a soft-blurred version of the
UI. Busy backgrounds compete with the interface.

**Device frames.** Optional for desktop, near-mandatory for mobile — a bare phone
screen recording floating on a background reads as unfinished.

**Rounded corners and a soft shadow** on the UI window. Nearly universal in the genre.

**Safe area.** If a 9:16 crop is planned, keep all critical content inside the center
vertical third from the start. Retrofitting is painful.

---

## 8. Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Feels cheap despite good UI | No motion blur, linear easing | Add both |
| Feels frantic | Every shot has motion, no holds | Alternate move and rest |
| Feels sluggish | Shots over 4s, slow easing | Cut shorter, faster eases |
| Feels "off" but looks fine | Cuts not on beats | Re-place cuts on markers |
| Text unreadable | Too many words, too little hold | 2–5 words, 0.6s+ hold |
| Looks like a tool demo | Mixed transition styles | Pick one and repeat it |
| Viewers drop instantly | Logo animation at the open | Cold open on the UI |
| Warped or melted UI | Generative model touched real pixels | Never generate over UI |
