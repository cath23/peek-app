# Nostr-for-Business demo — scenario player storyboard

Source of truth for beats: the Linear doc
[Scenarios of Nostr for Business](https://linear.app/peek-app/document/scenarios-of-nostr-for-business-49287455c230).
Designs: Figma `Peek- Claude to Figma`, Scenario boards (S1 = node 712-2933,
S2 = node 761-1285).

The player (`npm run dev` in this folder, port 5200) renders each scenario as
an ordered list of **scenes** on a fixed 1440×1024 stage (auto-scaled to the
window). **→ / ←** or click advances/rewinds one *step*; a step is either an
in-scene animation beat or a scene change. `?scenario=1&step=3` deep-links.

## Scenario 1 — Highlights in Huddle

| # | Scene           | Step / beat                                              | Status |
|---|-----------------|----------------------------------------------------------|--------|
| 0 | `meet-call`     | In-call grid: Greg, Peek Designer, Alice (muted), Stripe Engineer | ✅ pixel pass done (vs Figma 666:658) |
| 1 | `meet-ended`    | "You left the meeting"                                   | ✅ pixel pass done (vs Figma 681:2417) |
| 2 | `meet-ended`    | Highlights doc rises in (500ms fade+lift)                | ✅ |
| 3 | `peek-topic`    | Peek, Payment integration topic — empty but for the highlights, landed as a collapsed bar | ✅ real app in an iframe |
| 4 | `peek-topic`    | Camera pushes in on the bar; the card expands as it arrives | ✅ |
| 5 | `peek-topic`    | Camera pulls back out, expanded card in context          | ✅ |

Player: `?hud=0` or the **H** key hides the step HUD for recording. Fonts:
Meet scenes fall back Google Sans Flex → Roboto (CDN); metrics differ by
~1px in places — acceptable at recording distance.

Transitions: plain cuts between apps for now (crossfade at most). The
"object travels between apps" morph is explicitly parked — prototype only if
the plain version feels flat on film (ruling 2026-07-24: cuts first, morph is
a maybe).

## Running it

Two dev servers, and the player needs both:

```
npx vite --port 5173                       # the app, from the repo root
Set-Location demo-scenarios; npx vite --port 5200
```

Then http://localhost:5200/?scenario=1&step=0. Override the app's address
with `?peek=http://host:port` if 5173 is taken.

## The Peek scenes

They embed the REAL app in an iframe — not a rebuilt mock. The app runs in
**demo mode** (`?demo=1`, see `src/demo/` in the app):

- data is the static fixtures with `src/demo/scenario1.ts` overlaid, and
  demo mode reports no Convex deployment — so the embed needs no login and
  no live backend while recording;
- the viewer's portrait is the protagonist's — the same face as her Meet
  tile. It's the same person and the same browser all the way through, so
  the account portrait in the chrome is hers in every scene (the Figma
  boards had a different placeholder there);
- the player drives the embed over postMessage (`src/demo/demoBridge.ts`):
  it asks the app to expand the card, and the app reports where the card
  actually is so the camera can frame it.

The camera is a CSS transform on the whole browser-framed screen. Its zoom
comes from the card's width — filling the frame with the card, edge to edge
bar a margin, is as far in as it can go without cutting the card in half.
That width doesn't change when the card opens, so the zoom is identical
before and after and only the framing drifts: a camera that zooms in and then
back out to re-frame reads as hunting for its subject. Nothing is pinned to a
layout, so the beats keep working as the app's UI changes.

The topic itself is **empty apart from the highlights** (ruling 2026-07-27) —
nobody has typed a word in it, so the first thing in it is what the call
produced. Its members come from the topic, not from message authors.

The card itself is a real app component (`src/components/HighlightsCard.tsx`,
Storybook: Messages/HighlightsCard), rendered from the stream data
(`ConversationData.highlights`) — the same path a real highlights row will
take.

## Scenario 2 — The answer just shows up (parked until S1 is done)

Figma-app scene: canvas with payment-flow frames, Linear project widget,
AI feedback panel with staged typing and the "Asking Stripe sub-agent" beat.

## Working rules

- Committed to the repo (ruling 2026-07-24), isolated from the app build —
  nothing in `src/` may import from `demo-scenarios/`.
- Third-party app scenes are hand-built pixel-perfect from Figma via the
  Figma MCP (design context + exported assets), verified by screenshot diff.
- Every beat must be reachable by keyboard only — the player is built to be
  screen-recorded.
