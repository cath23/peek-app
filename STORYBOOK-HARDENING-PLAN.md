# Storybook Hardening & Extension Plan

**Status:** proposed (2026-07-08) — for review, then execution in a fresh session.
**Predecessor:** [`STORYBOOK-PLAN.md`](STORYBOOK-PLAN.md) — the *coverage* plan, now **complete** (every storyable component has a story). This document is the *quality / infrastructure / structure* follow-up, from a tech-lead review of that work.

---

## 0. Context & guardrails

- **Prime directive (from `CLAUDE.md`):** pixel-perfect, no exceptions; token-driven (never raw hex); reuse primitives. Any change here must not regress Peek's look.
- **Audience:** Storybook is also read by non-technical stakeholders (the `PRDs/Peek-Product-Overview.md` audience), so navigation and docs quality matter, not just DX.
- **Parallel track:** the **`@/api` data-access seam** migration is underway (imports moving `@/data/*` → `@/api`, mocks → `@/api/fixtures`). New story code should target `@/api` / `@/api/fixtures`. Coordinate — don't fight the codemod.
- **Scope carried over:** Huddles = V3/inline only; AI/launcher features parked; V1/V2-only components have no stories. Unchanged here.

## 1. Baseline (what exists today)

| Area | Current state |
|---|---|
| `.storybook/main.ts` | 6 lines — `framework` + stories glob. **No addons, no docs config.** |
| `.storybook/preview.tsx` | Theme toolbar toggles `.dark`; `layout: centered`; `controls.expanded`. **No `autodocs` tag.** |
| Stories | ~35 files, CSF3, colocated, `satisfies Meta`. Titles by folder: `UI/*`, `Components/*`, `Layouts/*`. |
| Providers | **Inlined per story** (`MemoryRouter`, `TopicMutationsProvider`, `ThemeProvider`, `DebugProvider`, `LastSelectionProvider`). |
| Fixtures | **Index into seed data** (`TOPIC_HUDDLES['1'][0]`, `SCREENER_ITEMS[1]`, `PEOPLE[0]`). |
| Handlers | `() => {}` no-ops (Actions panel unused). |
| Verification | `tsc -b` + `build-storybook` + 63 Vitest tests — **no test exercises a story.** Fidelity checked only by manual eyeballing. |

## 2. Workstreams

Effort key: **S** ≤1h · **M** a few hours · **L** a day+. Each item: *Gap → Why it matters here → Fix → Acceptance*.

### P0 — Quick wins (internal, no new infra)

**W1 — Enable Autodocs.** **(S)**
- *Gap:* No `autodocs` tag anywhere, so every JSDoc description + `argTypes` we wrote renders on **no Docs page** — only the Canvas exists.
- *Fix:* Add `tags: ['autodocs']` (preview `tags` global) + `docs` config in `main.ts`. Audit that per-story descriptions surface; add `parameters.docs.description.component` where useful.
- *Acceptance:* Every component has a Docs tab showing description, args table, and stories.

**W2 — Intro + Design-Tokens showcase pages.** **(M)**
- *Gap:* No landing page; **no page visualizing the design tokens** (colors, typography, radius, shadows) — a glaring omission for a token-driven, pixel-perfect system.
- *Fix:* Add `src/stories/Introduction.mdx` (what Peek's Storybook is, taxonomy, conventions) and `src/stories/DesignTokens.mdx` (swatches/type ramp/radii/shadows pulled from `tailwind.config.js` tokens). Order them first via `main.ts` stories glob or story `order`.
- *Acceptance:* Storybook opens on an Intro; a Tokens page renders all token families in both themes.

**W5 — Shared provider decorators.** **(S–M)**
- *Gap:* Provider combos inlined across ~15 files → drift risk, noise.
- *Fix:* One module (`.storybook/decorators.tsx` or `src/stories/decorators.tsx`) exporting composable decorators: `withPeekProviders` (all), `withRouter`, `withTopicMutations`, `withTheme`, `withDebug`, `withLastSelection`. Refactor existing stories to use them.
- *Acceptance:* No story inlines a `<Provider>`; decorators are imported from one place.

**W6 — Role-based title taxonomy.** **(M)**
- *Gap:* `UI/` vs `Components/` mirrors *folders*, not meaning; poor for the non-technical audience.
- *Fix:* Retitle to roles matching the coverage plan's tiers, e.g. `Primitives/*`, `Cards/*`, `Menus/*`, `Dialogs/*`, `Composer/*`, `Chrome/*`, `Sections/*`, `Docs/*`. Decide the final set in §4. Keep component file locations; only `title` changes.
- *Acceptance:* Sidebar reads as a mental model, not a directory tree; documented in the Intro page.

**W7 — Named story fixtures + `@/api/fixtures` consistency.** **(M)**
- *Gap:* Index-into-seed-data couples stories to mock *ordering* (reorder → silent break); a few stories still import `@/data/*` post-migration.
- *Fix:* Add purpose-built named fixtures (`resolvedHuddleFixture`, `urgentDmFixture`, `topicHeaderMembers`, …) — minimal, stable, intention-revealing — sourced from/near `@/api/fixtures`. Point every story at them; remove index access and residual `@/data/*` imports.
- *Acceptance:* No story indexes a seed array; all story data comes from named `@/api/fixtures` exports.

**W8 — `fn()` handlers + Actions.** **(S)**
- *Gap:* `() => {}` no-ops leave the Actions panel empty and can't be asserted.
- *Fix:* Replace handler args with `fn()` (from `storybook/test`); rely on it for play-function spies (W10).
- *Acceptance:* Interacting with a story logs events in Actions.

### Infra (small, high value)

**W3 — Run stories as tests.** **(M)**
- *Gap:* Stories aren't executed in the test suite; a render crash ships unless `build-storybook` happens to fail.
- *Fix:* Add the **Storybook Vitest addon** (portable stories → Vitest) so every story is a render smoke test and play functions run as assertions. We already run Vitest (63 tests). Alternative/además: `@storybook/test-runner` against a built Storybook in CI.
- *Acceptance:* `npm run test:run` fails if any story throws on render or a play assertion fails.

**W9 — Accessibility (a11y) addon.** **(S)**
- *Gap:* No automated a11y checks.
- *Fix:* Add `@storybook/addon-a11y`; review violations, especially contrast in both themes.
- *Acceptance:* a11y panel present; no critical violations on primitives.

### Strategic bet (highest ROI, needs a decision)

**W4 — Visual regression testing.** **(L, + external account for Chromatic)**
- *Gap:* "Pixel-perfect, no exceptions" is the #1 rule, yet fidelity is verified **only by manual review** — the reason regressions kept being caught by eye during the coverage work.
- *Fix (pick one in §4):* **(a) Chromatic** — hosted, snapshots every story on PR, review UI, cross-theme; easiest, paid tiers. **(b) Playwright snapshots** — `@storybook/test-runner` + `toMatchSnapshot` (or `@playwright/test` over the built Storybook); free, self-hosted, more setup + snapshot-management burden.
- *Acceptance:* Every PR diffs all stories visually; a fidelity change fails CI until approved.
- *Note:* This is the item I'd prioritize above all other P1/P2 work once P0 lands.

### P2 — Coverage & polish

**W10 — Interaction-gated states via `play`.** **(L)**
- *Gap:* Slash menu, hover quick-menus, card **edit mode**, the More menu, highlight submenu, theme menu are documented as "type/hover to see" but **not shown or tested**.
- *Fix:* Add `play` functions (`storybook/test` `userEvent`/`expect`) to open + assert these states; pairs with W3/W8. Where a state can't be driven (internal-only), consider a minimal story-only prop or a forced-state wrapper.
- *Acceptance:* Each interaction-gated state has a story that opens it and asserts the result.

**W11 — Dark-mode ThemeProvider sync.** **(S)**
- *Gap:* `TopBar`/`AppShell` wrap `ThemeProvider`, which fights the preview `.dark` toolbar → those stories ignore the theme switch.
- *Fix:* A decorator that drives `ThemeProvider` from the toolbar global (or a story-only theme shim). Verify all stories render in both themes.
- *Acceptance:* Toolbar light/dark toggles every story, including TopBar/AppShell.

**W12 — Reconcile the two avatar stacks.** **(M)**
- *Gap:* `AvatarGroup` (header: 3, `-mr-2`, `border-bg-surface`) vs `MemberAvatars` (huddle grid: 4, `-ml-2`, configurable border) — real duplication.
- *Fix:* A single `AvatarStack` primitive (props: `max`, `direction`/overlap, `borderClass`), **verified visually** against both call sites before adopting (see the AvatarStack fidelity lesson in `feedback_styling_fidelity_and_reuse`). Then retire both.
- *Acceptance:* One avatar-stack primitive; both surfaces pixel-identical to today (VR-confirmed once W4 lands).

**W13 — CI wiring + deployed Storybook.** **(M)**
- *Gap:* No CI runs `build-storybook`/story tests; no shared living reference for the team.
- *Fix:* CI job for `build-storybook` + `test:run`; publish Storybook (Chromatic or Vercel) as the team's canonical component reference.
- *Acceptance:* PRs run the Storybook checks; a URL shows the current library.

## 3. Recommended sequencing

1. **P0 bundle** — W1, W2, W5, W6, W7, W8 (all internal, compounding: docs + structure + fixtures make everything after easier).
2. **W3** (stories-as-tests) + **W9** (a11y) — cheap safety nets.
3. **W4** (visual regression) — the strategic bet; decide vendor first (§4).
4. **W10, W11, W12, W13** — coverage/polish, in that order.

## 4. Open decisions (need input before/at execution)

- **D1 — Visual regression vendor:** Chromatic (hosted/paid/easy) vs Playwright snapshots (free/self-hosted/more upkeep). Blocks W4.
- **D2 — Title taxonomy:** confirm the final section set (proposed: `Primitives / Cards / Menus / Dialogs / Composer / Chrome / Sections / Docs`).
- **D3 — Location:** decorators + fixtures under `.storybook/` vs `src/stories/`? (Lean `src/stories/` so they share the app's TS/alias config.)
- **D4 — Autodocs scope:** global `autodocs` tag vs per-component opt-in.
- **D5 — Fixtures ownership:** do purpose-built story fixtures live in `@/api/fixtures` (shared) or a Storybook-only `src/stories/fixtures.ts`? (Depends on how the `@/api` seam wants to treat mock data.)

## 5. Non-goals / out of scope

- The `@/api` seam migration itself (separate backend track — MIGRATION.md step 2).
- Rebasing `HuddleCreator` onto `PersonChipInput` (optional dedup, tracked in `STORYBOOK-PLAN.md`).
- V1/V2 huddle components, AI/launcher parked features (per the coverage plan's scope).
- New product features.

## 6. Definition of done (for this plan)

- Autodocs on; Intro + Tokens pages live; role-based titles; shared decorators; named `@/api/fixtures`; `fn()` handlers.
- Stories run in the test suite; a11y addon active.
- A visual-regression pipeline diffs every story per PR (vendor per D1).
- Interaction-gated states have play-driven stories; both themes verified everywhere.
- One `AvatarStack`; Storybook checks in CI + a deployed reference URL.
