# Peek — the real app

Peek is a team-communication app (DMs, Topics, Huddles, Screener, Desk). This
repo is the production app grown out of the pixel-perfect prototype preserved
at `k:\PeekApp` (GitHub `cath23/Peek`, tag `prototype-v1`). See
`docs/PROTOTYPE.md` and `docs/MIGRATION.md` for lineage, and
`PRDs/Peek-Product-Overview.md` for the feature spec. (`docs/` and `PRDs/` are
local-only — kept out of the published repo; see `.gitignore`.)

## Stack

React 19 + Vite + TypeScript + Tailwind (custom design tokens in
`tailwind.config.js`) + Tiptap composer. Tests: Vitest (`npm run test:run`).
Storybook: `npm run storybook`. Backend: Convex (cloud dev deployment
`hallowed-stork-966`, config in `.env.local`; schema in `convex/schema.ts`,
spec in `PRDs/Peek-Domain-Model.md`). Demo data:
`npx convex run dev/seedDemo:seed '{"wipe": true}'` — dev-only fixture;
**production launches with an empty database, no mock data**
(decision 2026-07-08).

## Working rules

- **Type-check with `npx tsc -b`** — never `tsc --noEmit` (matches the Vercel
  build, which runs `tsc -b && vite build`).
- **Pixel-perfect, no exceptions.** The prototype is the visual reference.
  Use design tokens, never raw hex; reuse existing primitives
  (Avatar/AvatarStack/ListRow/Chip/IconButton…) instead of re-hand-rolling.
- **tw-merge pitfall:** custom text classes like `text-btn-small` get silently
  dropped when followed by a `text-{color}` class in merged class lists — use
  explicit arbitrary values (`text-[12px] leading-[12px]`) in shared components.
- **Menus/popovers:** stay open on hover, close on mouse leave, guard the
  parent hover state, close on outside click and Escape.
- **Only offer actions that can succeed** — an action appears only in contexts
  where it works; the enabling surface advertises the capability.
- **No AI features** in this app for now (product decision 2026-07-08); the
  prototype keeps them for reference.
- **Data access only through the seam.** Components/pages/extensions import
  app data exclusively from `@/api` (stories: `@/api/fixtures`) — never from
  `@/data/*` or `@/api/internal/*`. All writes go through `usePeekActions()`
  and stamp `CURRENT_USER_NAME` (the Phase 3 identity switch point). Extend
  the seam rather than bypassing it.

## Direction — docs/internal/PRODUCTION-PLAN.md is the single source of truth for progress

Phase 0 (domain spec) ✅ and Phase 1 (data-access seam) ✅ are done
(2026-07-08). Phase 2 (Convex persistence, hardcoded "You") is in progress:
schema deployed + demo data seeded + `ConvexProvider` wired; next is the
entity-by-entity hook swap (people → topics → messages → …), deleting one
`src/api/internal/` override layer per swap, with a skeleton/empty-state
Figma pass before the first visible swap. Then Phase 3 auth. Put a `userId`
on every new record from day one. Check off worklog items in the same commit
as the work; log decisions in the Decision log.
