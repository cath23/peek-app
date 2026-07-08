# Migration manifest — prototype → real app

**Date:** 2026-07-08
**Source:** `k:\PeekApp` = GitHub `cath23/Peek`, commit `5b7a872`; tag
`prototype-v1` = `d9b8aea` (same content plus restored AI wiring in AppShell —
the difference is AI-only and irrelevant to this repo)
**Destination:** this repo (`k:\Peek`)

## How this repo was created

1. The prototype was frozen: all pending work committed as `5b7a872`, tagged
   `prototype-v1`, pushed to `cath23/Peek`. The prototype repo stays intact
   forever; nothing was removed from it.
2. The full working tree was copied here verbatim (excluding `node_modules`,
   `.git`, `dist`, `storybook-static`) and committed as the root commit —
   so the diff between the prototype and this app is fully auditable in git
   history.
3. AI-related features were then removed in a dedicated commit (see below).

## What was carried over

- **The entire app**: all components, pages, view hooks, Tiptap extensions,
  design tokens (`tailwind.config.js`), Storybook setup, Vitest setup + tests.
- **Docs**: `PRDs/` (including the Product Overview — the feature spec),
  `QA-PLAN.md`, `STORYBOOK-PLAN.md`. Docs describing AI features were kept as
  historical/vision reference even though the features were not carried.
- **Mock data** (`src/data/`): kept for now; it becomes seed data for the real
  database and is the informal schema for the domain model.
- **Claude project memory**: copied from the `k--PeekApp` project memory to
  this project's memory, so all accumulated design rules and session context
  apply here.

## What was deliberately left behind (AI features)

Per product decision (2026-07-08): the real app starts as human-to-human chat
only. Removed after the verbatim baseline commit:

- **Intelligence prototype**: composer assist (`ComposerAssist`), catch-me-up
  (`intelligenceBridge`, ThreadPanel checkpoints), topic Timeline
  (`TimelineView`, `timelineData`), @App query rows in the mention menu,
  Intelligence rows + Ask-Peek fallback in the command launcher, Intelligence
  debug section.
- **Agents**: the Linear/Figma/GitHub agents section in the People panel
  (`agentData`, `NewAgentDmDialog`, agent DM conversations).

All of these remain fully working in the frozen prototype (`prototype-v1`)
for reference.

**Kept** (not AI): the ⌘K command launcher (search, scope chips, Figma
drill-in), Figma find/attach pipeline, reference chips + auto-linking.

## Known losses

- `src/components/SelectionToolbar.tsx` (Intelligence selection mini-toolbar)
  was lost from disk in the prototype before it was ever committed; it exists
  nowhere. Not reconstructed — it was an AI feature, and `ComposerAssist`
  (restored in prototype `d9b8aea`) covers the selection-toolbar role there.
- `k:\Peek` previously contained an old git-less Next.js-era Peek workspace.
  It was quarantined to `k:\Peek-previous-mixed` (see the README inside it);
  a few of its root config files were overwritten during the first copy
  attempt and are unrecoverable.

## Reference material NOT copied (lives elsewhere)

- Monorepo extraction work (`packages/ui`, `MONOREPO-PLAN.md`,
  `COMPONENT-BACKLOG.md`): on the `monorepo` branch of `cath23/Peek`. Reusable
  later if/when component extraction resumes here.
- Figma design-token file and component library: in Figma (see prototype
  memory/docs).

## Next steps (agreed plan)

1. Domain model spec: formalize the entities implied by `src/data/` (real
   `Date`s, one ID scheme, explicit relations).
2. Data-access seam: replace direct `src/data/` imports with hooks
   (`useTopics()`, `useDmConversation(id)`, …) returning the same mock data —
   zero visual change.
3. Backend: **Convex** (free plan; no project pausing, reactive queries fit
   the hook seam). Phase A = persistence with hardcoded "You" user; Phase B =
   auth (add `userId` on every record from day one).
