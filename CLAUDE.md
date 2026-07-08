# Peek — the real app

Peek is a team-communication app (DMs, Topics, Huddles, Screener, Desk). This
repo is the production app grown out of the pixel-perfect prototype preserved
at `k:\PeekApp` (GitHub `cath23/Peek`, tag `prototype-v1`). See `PROTOTYPE.md`
and `MIGRATION.md` for lineage, and `PRDs/Peek-Product-Overview.md` for the
feature spec.

## Stack

React 19 + Vite + TypeScript + Tailwind (custom design tokens in
`tailwind.config.js`) + Tiptap composer. Tests: Vitest (`npm run test:run`).
Storybook: `npm run storybook`. Planned backend: Convex (not wired yet).

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

## Direction (see MIGRATION.md "Next steps")

Domain model spec → data-access seam over `src/data/` mocks → Convex backend
(Phase A: persistence, hardcoded "You"; Phase B: auth). Put a `userId` on
every new record from day one.
