# Production plan — from mock-data app to fully functional app

**Date:** 2026-07-08
**Scope:** everything between "pixel-perfect UI over mocks" (today) and "real
multi-user app with login, profiles, and a database". Builds on the decisions
in `MIGRATION.md` → *Next steps*: Convex backend, persistence before auth,
`userId` on every record from day one. No AI features (product decision
2026-07-08).

---

## Where we are today

- **UI: complete.** All pages (Desk, People/DMs, Topics, Huddles, Screener),
  the Tiptap composer with mentions/urgent/topic-refs/file-refs/attachments,
  thread panel, resolution flow, reactions, command launcher. Vitest suite +
  Storybook + QA plan (`k:\PeekApp\QA-PLAN.md`) exist.
- **Data: 10 mock modules in `src/data/` (~1,900 lines)**, imported directly
  in **43 files / 74 import sites**. The shapes are presentation-shaped, not
  domain-shaped:
  - authorship by **display name string** (`authorName: 'Juan Foley'`,
    `'You'` literal for self); avatars resolved by name lookup
  - **display-string timestamps** (`'9:14 AM'`, `dateLabel: 'Mon, September 2'`)
    — no real dates except optional `createdAtMs`/`promotedAtMs` added later
  - **derived state baked in**: `replyCount`, `hasNewMessage`, `hasNewReply`,
    `isUnread` are hardcoded facts, not computed
  - **two ID schemes**: string ids for topics/messages, `number` ids for DMs
  - reactions stored as pre-aggregated `{emoji, count, owner: 'yours'|'others'}`
- **Mutations: one in-memory context** (`src/lib/topicMutations.tsx`) holding
  eleven override layers (sent messages, sent replies, deletions, body edits,
  resolution overrides, highlights, created huddles, reactions, …) merged over
  the static mocks at render time. Everything is lost on refresh.
- **No loading, error, or empty-data states anywhere** — mocks are synchronous,
  so no page has ever needed one.
- Deploy target: Vercel (`tsc -b && vite build`), analytics already wired.

## Target architecture

```
React UI (unchanged, pixel-perfect)
   │  hooks only — no component ever imports src/data or raw Convex
   ▼
Data-access seam  src/api/   useTopics(), useDmConversation(id), sendMessage(), …
   ▼
Convex            convex/schema.ts + queries/mutations (reactive = realtime free)
   ▼
Convex Auth       identity, sessions → userId on every record
```

---

## Phase 0 — Domain model spec (docs only)

Formalize `PRDs/Peek-Domain-Model.md` from the entities implied by `src/data/`.

Core tables (first cut):

| Table | Replaces | Notes |
|---|---|---|
| `users` | `PEOPLE` + `'You'` literal | name, role, avatar (Convex file storage), email. Seeded with the 8 mock people. |
| `topics` | `TOPICS` | title, creatorId, createdAt. `isResolved` becomes **derived** (the `isTopicResolved` rule in topicMutations is already the source of truth — it moves into a query). |
| `topicMembers` | `invitees?: string[]` | (topicId, userId) — names → IDs. |
| `messages` | `ConversationData` in `TOPIC_CONVERSATIONS`, `DM_CONVERSATIONS`, huddle convs | **one table** with a polymorphic parent: `{kind: 'topic'\|'dm'\|'huddle', parentId}`. authorId, body, createdAt (real ms), urgent, highlightType, resolution fields (`resolvedBy`, `resolutionMessage`, `resolvedByReplyId`), attachment ids. |
| `replies` | `ReplyData` | messageId, authorId, body, createdAt, urgent, highlight, attachments. |
| `reactions` | `ReactionData` | **per-user rows** (messageId, userId, emoji); counts + "yours" aggregate in the query. |
| `dmConversations` | `DM_CONVERSATIONS` keys (numeric!) | participant pair; kills the `number` id scheme. |
| `huddles` | `HUDDLES` | topicId, memberIds, state, originDmId/promotedAt for the DM-promotion flow. |
| `readState` | `hasNewMessage`/`isUnread` flags | (userId, parentId, lastReadAt) — unread becomes **derived per user**. Phase 4; until then unread flags come from seed. |
| `stars`, `screenerItems` | `STARRED`, `SCREENER_ITEMS`, desk lists | per-user; Desk page becomes a derived view. |

Key normalization decisions (each currently violated by the mocks):
1. **authorName → authorId** everywhere; `'You'` becomes *comparison against
   current userId*, resolved to the hardcoded seed user until Phase 3.
2. **Real `Date`s**; `'9:14 AM'` / `dateLabel` grouping become client-side
   formatting of `createdAt`. Seed dates are chosen so the **rendered labels
   match the mock strings exactly** (pixel-perfect applies to seed data too).
3. **Derived, never stored**: replyCount, unread, topic-resolved, and the
   Desk Urgent section. *(Amended 2026-07-08: Screener rows and Desk Open
   work are stored by design — Screener is the incoming-message inbox with a
   triage lifecycle, Open work is manually curated until closed. See domain
   model §2.12–2.13.)*
4. Files/Figma/Linear reference data (`filesData`, `figmaData`, `linearData`)
   **stay static** — they mock third-party integrations, which are a separate,
   much later project. They move behind the seam like everything else so they
   can be swapped when real integrations land.

## Phase 1 — Data-access seam (zero visual change)

Create `src/api/` hooks + mutation functions; components stop importing
`src/data/*` and stop reaching into `useTopicMutations` setters.

- Read hooks: `useTopics()`, `useTopicMessages(topicId)`,
  `useDmConversation(dmId)`, `useThread(messageId)`, `useHuddles(topicId)`,
  `usePeople()`, `useScreenerItems()`, `useDeskItems()`, `useFiles()`, …
  Internally they do exactly what components do today: merge static mocks with
  the TopicMutationsProvider overrides. The provider becomes **private to the
  seam**.
- Write functions: `sendMessage`, `sendReply`, `editMessage`, `deleteMessage`,
  `resolveMessage`/`reopen`, `setHighlight`, `toggleReaction`, `createTopic`,
  `createHuddle`, `promoteDmToTopic`, `deleteHuddle`, … replacing the eleven
  raw `setX` setters currently called from components.
- Migrate the 43 importing files batch-by-batch (pages → view hooks →
  components); `npx tsc -b` + `npm run test:run` + Storybook after each batch;
  finish with the QA-plan regression checklist.
- Exit criterion: `grep "from '@/data/" src/{pages,components}` returns only
  the seam and type-only imports.

## Phase 2 — Convex, Phase A: persistence with hardcoded "You"

- `convex/schema.ts` from the Phase 0 spec; free-plan deployment.
- **Production starts empty — no mock data in the real app** (user decision
  2026-07-08). The mock→records transform survives only as an **optional
  dev-only fixture** (`convex/dev/seedDemo.ts`, never run against prod):
  names→userIds, display timestamps→real dates that render to the same
  labels, aggregated reactions→per-user rows, DM numeric keys→conversation
  docs. Useful for developing/QA-ing chat UI against a populated DB; the
  QA-plan charters assume this dataset.
- Swap seam internals to `useQuery`/`useMutation` **one entity at a time**
  (people → topics → messages → replies → resolutions/highlights → reactions →
  huddles+promotion → stars/screener), deleting the corresponding override
  layer from TopicMutationsProvider at each step; the provider is empty and
  removed at the end.
- All writes stamp the fixed seed `userId` for "You". Optimistic updates on
  composer send so the sent-message render stays instant.
- New requirement surfaced here: **loading, error, and — since production
  starts empty — first-class empty states for every surface** (topics list,
  DM list, Desk, Screener, huddles tab, thread panel; Convex queries also
  return `undefined` while loading). None of these exist in the prototype —
  design them (Figma, tokens) before building (pixel-perfect rule).

## Phase 3 — Convex, Phase B: auth, login, profiles

- **Convex Auth** (`@convex-dev/auth`) with password + Google OAuth. (Clerk is
  the fallback if we want prebuilt UI, but it adds a vendor and a paid tier;
  Convex Auth keeps everything in one free stack.)
- New UI (no prototype reference exists — design first, in Figma, using the
  existing token library): login / sign-up screen, auth loading state, profile
  view+edit (name, role, avatar upload via Convex file storage), sign-out in
  the top-bar user menu.
- Replace the hardcoded seed user: every mutation reads identity from
  `ctx.auth`; every query scopes by the authenticated user. Router gets an
  auth gate (unauthenticated → login screen).
- **"You" sweep**: every place that renders self-attribution (message cards,
  reply cards, reaction "yours" styling, avatar lookups, composer identity)
  switches from the `'You'` name convention to `authorId === currentUser.id`,
  displaying "You" only as a render-time label.

## Phase 4 — Real multi-user

- Single shared workspace to start (everyone who signs up joins it — fine for
  a demo/beta; workspace invites are a later decision).
- `readState` goes live: unread dots and `hasNewReply` become fully derived
  per user (one watermark per container). Screener auto-creation goes live
  (incoming non-urgent messages create items; urgent → Desk Urgent); Open
  work stays manually curated.
- Realtime message delivery is already free via Convex reactive queries;
  verify multi-client behavior (two browsers) against the QA plan.
- Optional polish: presence / typing indicators (Convex presence component).

## Phase 5 — Production hardening

- Convex prod deployment + Vercel env wiring (`VITE_CONVEX_URL`).
- Pagination for long topics/DMs (`usePaginatedQuery`) — mocks are small, real
  data won't be.
- Attachment/file upload storage (currently Figma-frame mocks only).
- Error boundaries, retry states, offline notice.
- Rate limiting / input validation on mutations (Convex validators).

## Explicitly out of scope (for later)

- Real Figma / Linear / GitHub integrations (launcher + files stay mocked).
- Notifications (email/push), mobile, message search backend (client search
  over loaded data is fine initially).
- AI features (product decision 2026-07-08 — prototype keeps them).

---

## Difficulty & effort estimate

Overall: **medium — high volume, low novelty**. Nothing here is research-y;
the risk is regression, and the test suite + Storybook + QA plan mitigate it.

| Phase | Effort (focused sessions) | Difficulty | Risk |
|---|---|---|---|
| 0 — Domain spec | 1–2 | Medium (thinking work: derived-state + message unification decisions) | Low |
| 1 — Seam | 2–4 | Low-medium (wide but mechanical; 43 files) | Low — zero-visual-change, fully testable |
| 2 — Persistence | 3–5 | Medium (seed transform + entity-by-entity swap; loading states are new UI) | Medium — date/label fidelity, derived-count mismatches in seed data |
| 3 — Auth + profiles | 2–4 | Medium-high (auth wiring is standard; the "You" sweep and new login/profile UI touch everything) | Medium |
| 4 — Multi-user | 2–3 | Medium (read-state modeling) | Low-medium |
| 5 — Hardening | 2–3 | Low-medium | Low |

**Total: roughly 12–20 focused sessions.**

The three genuinely hard parts:
1. **De-presentation-izing the data** (names→IDs, strings→dates, stored→derived)
   without any visual drift — mitigated by choosing seed data that renders
   identically and by the QA regression checklist.
2. **Loading/empty/error states** — a whole class of UI the prototype never
   needed; must be designed (Figma, tokens) before Phase 2 can finish.
3. **The identity sweep** in Phase 3 — `'You'`-as-name is woven through
   rendering, reactions, resolution attribution, and the composer.

## Sequencing rule

Phases are strictly ordered (each depends on the previous), but within
Phases 2–3 work ships entity-by-entity, so the app is demoable at every
commit — never a big-bang cutover.

---

## Worklog (single source of truth for progress)

How we track (same convention as `STORYBOOK-PLAN.md`):
- Check items off **in the same commit** as the work; stamp finished phases
  with a date (e.g. `✅ all done 2026-07-XX`).
- One session ≈ one batch; every batch ends green: `npx tsc -b` →
  `npm run test:run` → visual pass → commit. Git history is the audit log.
- Detail is added just-in-time: only the current and next phase carry full
  task lists; later phases stay coarse until their predecessor is done.
- Decisions made along the way get a dated one-liner under *Decision log*.

### Phase 0 — Domain model spec ✅ all done 2026-07-08
- [x] Write `PRDs/Peek-Domain-Model.md`: tables, fields, indexes, and the
      derivation rules (topic-resolved, replyCount, unread, screener/desk)
- [x] Decide message unification: one `messages` table with
      `{kind, parentId}` vs per-surface tables — confirm against huddle
      promotion + resolution-by-reply edge cases → **unified** (spec §3;
      both edge cases walked through)
- [x] Decide seed-date strategy: concrete dates/timezone that render to the
      exact mock labels (`'Mon, September 2'`, `'9:14 AM'`) → per-label
      year resolution in Europe/London, anchor = seed run (spec §5)
- [x] Coverage check: walk every exported type in `src/data/*` → each field
      is mapped, derived, or explicitly dropped (list the drops) → spec §7,
      incl. the 11 topicMutations layers + topicStore

### Phase 1 — Data-access seam *(code done 2026-07-08 — QA pass pending)*
- [x] Scaffold `src/api/`: read hooks (`useTopics`, `useTopicMessages`,
      `useDmMessages`, `useThread`, `useHuddleLookup`, `useHuddleMessages`,
      `useScreenerItems`, `useDeskItems`, `useReplyCount`, static reference
      module, `DM_DIRECTORY`) — merged reads: overrides applied, deletions
      filtered, replyCount computed; components never see override maps
- [x] Write functions (`usePeekActions()`): sendTopic/Dm/HuddleMessage,
      sendReply, delete*, editBody, editHuddleSeedBody, setHighlight,
      setReactions, setResolution/setThreadResolution, createHuddle,
      createEmptyHuddle, deleteHuddle; `useCreateTopicFromDm` — all stamped
      with `CURRENT_USER_NAME` (Phase 3 switch point). *(setReactions keeps
      the aggregate-array shape for now; becomes toggleReaction in Phase 2.)*
- [x] Migrate pages (`DeskPage`, `PeoplePage`, `TopicsPage`) — hardcoded DM
      name lists replaced by seam `DM_DIRECTORY`
- [x] Migrate view hooks (`useTopicView`, `useDmConversationView`) —
      ThreadPanel's override-map props removed (replies arrive merged)
- [x] Migrate remaining components (ThreadPanel, cards, menus, launcher,
      extensions) batch-by-batch
- [x] Make providers private to the seam: moved to `src/api/internal/`
      (topicMutations, topicStore, starred); app mounts one
      `PeekDataProvider`. Exit criterion exceeded:
      `grep "@/data/" src/{pages,components,extensions}` → zero hits
      (stories use `@/api/fixtures`)
- [x] Swap story decorators to `PeekDataProvider`; Storybook build green
- [x] New `src/app.smoke.test.tsx`: mounts the real provider stack, drives
      Desk/Topics/People through the seam (66 tests green; `tsc -b`, vite
      build, storybook build all green)
- [ ] QA-plan regression checklist (manual visual pass — user)

### Phase 2 — Convex persistence
- [x] `convex/schema.ts` from the domain model (13 tables; unified messages
      table; standard `_generated` stubs hand-written until the first
      `npx convex dev` regenerates them; `npx tsc -p convex` green)
- [x] Dev-only demo fixture `convex/dev/seedDemo.ts` (+ `seedDates.ts`
      London calendar math, 18 unit tests): the full mock→records
      transform — never runs against prod
- [x] **USER STEP — provision a deployment** ✅ 2026-07-08: cloud dev
      `hallowed-stork-966` live, demo dataset seeded and verified
- [x] **USER STEP — loading/empty-state design review** ✅ 2026-07-08:
      Figma designs ("Peek: Claude to Figma" → *Loading & Empty States*
      page) approved with rulings — see decision log. Error states deferred
      to Phase 5 (error boundaries)
- [x] Skeleton React components (`src/components/ui/Skeleton.tsx` + story):
      bar/row/sidebar-list/conversation-card primitives, `bg-inset` +
      `animate-pulse`, wrapped in `animate-skeleton-in` (150ms delayed
      reveal — fast loads never flash a skeleton)
- [x] Beginning-of-conversation banner everywhere it applies (review
      ruling): any topic with no public messages + empty DMs
      (`NewTopicBanner kind='dm'`, no invite button)
- [x] Wire `ConvexProvider` into the seam (`VITE_CONVEX_URL`); mocks remain
      the fallback until each entity swaps (commit 6a2d437; `hasConvex`
      gate, `seedKey` transition bridge)
- [x] **Entity swaps 1+2 — people + topics** (2026-07-08): first public
      Convex functions (`convex/people.ts` list, `convex/topics.ts`
      list/create); `usePeople()` hook (avatars stay client-side
      `avatarFor`); `useTopics`/`useTopicLookup` Convex-backed with
      `undefined` loading state + sidebar skeletons in
      TopicsPage/PeoplePage; People list = ALL workspace people (ruling),
      synthetic dmIds for people without a seeded conversation; topic
      creation double-writes (optimistic local + `topics.create` sharing
      the client id via seedKey, merge dedupes); seeded topics bridge
      invitees from mocks (seed wrote no topicMembers rows); ConvexProvider
      always mounted (placeholder client + 'skip' when no deployment)
- [x] **Entity swap 3 — messages** (2026-07-08): `convex/messages.ts`
      (list/get/send/editBody/remove, `by_seedKey` index);
      `src/api/format.ts` = the §5 client formatting module (9 unit
      tests); `useTopicMessages`/`useDmMessages` Convex-backed with
      `isLoading` → `SkeletonConversationList` in both conversation views;
      sends/edits/deletes double-write (optimistic local + Convex, seedKey
      = client id, reads dedupe); first message to a person without a
      conversation creates the DM record on demand (`dmPartnerName`);
      `useThread` gets a Convex `get` fallback so threads on
      prior-session messages open after refresh. Still local-only until
      their entities swap: replies, reactions, resolutions/highlights
      (their overrides merge on top of Convex rows), unread flags
      (Phase 4 readState), huddle messages.
- [x] **Entity swap 4 — replies** (2026-07-08): `convex/replies.ts`
      (list/send/remove); replies get `seedKey` (schema + seed patch +
      reseed) so seeded isNew flags and reply-keyed overrides keep
      rendering pixel-identical; `useThread` reads replies from Convex
      (remote-wins dedupe, `isLoading` → skeleton reply cards in
      ThreadPanel); cards take the server-derived replyCount in Convex
      mode; `messages.editBody` covers reply bodies; sendReply/deleteReply
      double-write
- [x] **Entity swap 5 — resolutions + highlights** (2026-07-08):
      `messages.setResolution` (reply-pointer semantics: card-level resolve
      drops it, thread-level keeps it, `→ msg` replies stamp it) +
      `messages.setHighlight` (covers replies too); actions double-write;
      `useThread` falls back to the persisted resolution after refresh;
      topic resolution (§4.1) now derived server-side in `topics.list` and
      `useIsTopicResolved` reads it in Convex mode (verified: seeded topics
      4+5 resolved, matching mocks)
- [x] **Entity swap 6 — reactions** (2026-07-08): server aggregates the
      per-user rows into the cards' `{emoji, count, owner}` shape
      (first-seen order — verified pixel-equal to mocks incl. 'yours');
      `messages.toggleReaction` add/removes the current user's row; the
      seam diffs the card-computed next aggregate against `prev` to find
      the toggled emoji (components untouched, optimistic display kept).
      Reply reactions stay session-local (the reactions table is
      message-keyed; revisit if reply reactions should persist)
- [x] **Entity swap 7 — huddles + promotion** (2026-07-08):
      `convex/huddles.ts` — one `list` query returns every huddle fully
      shaped (members in order, preview conversation = seed DM message for
      promoted / first message otherwise, extraConvs, lastActivityMs,
      promotion metadata); `create`/`createFromDm`/`remove` (remove
      cascades messages+replies+reactions); `messages.send` accepts
      huddle parents. Seam: `useHuddleLookup`/`usePromotedHuddleLookup`
      merge remote + session-local (remote wins), `useHuddlesLoading` →
      `SkeletonHuddleGrid` on the huddles tab; `useHuddleMessages` dedupes
      local sends. `useCreateTopicFromDm` chains topic → huddle mutations
      (huddle resolves its topic by the shared seedKey).
      `editHuddleSeedBody` stays session-local by design (separate from
      the real message body). Local `extraTopics`/`extraHuddles`/
      `createdHuddles` now cover only the optimistic window
- [ ] Entity swap 8 — stars/screener/open-work (per-user tables), then
      delete the override providers + mock bridges; optimistic updates
      audit on composer send
- [ ] `src/api/internal/` stores empty → deleted; app runs entirely on
      Convex with hardcoded seed user
- [ ] Regression: tests + Storybook + QA checklist (incl. the deferred
      Phase 1 pass)

### Phase 3 — Auth + profiles *(coarse until Phase 2)*
- [ ] Convex Auth setup · login/profile UI designed in Figma then built ·
      auth gate · "You" identity sweep

### Phase 4 — Multi-user *(coarse)*
- [ ] Shared workspace · live readState · two-browser QA pass

### Phase 5 — Hardening *(coarse)*
- [ ] Prod deploy + env wiring · pagination · uploads · error boundaries

### Decision log
- 2026-07-08 — Plan written; auth choice Convex Auth (password + Google),
  Clerk only as fallback; Files/Figma/Linear stay mocked behind the seam.
- 2026-07-08 — Storybook is **not a gate** for this plan: Phase 1 is verified
  in the running app + tests + QA checklist; existing stories must keep
  working, but no new stories are written for the seam's sake. The Storybook
  backlog proceeds in parallel on its own plan.
- 2026-07-08 — Domain model spec written (`PRDs/Peek-Domain-Model.md`).
  Messages unified into one table `{parentKind, parentId}`; promotion never
  copies messages. `readState` needs two granularities (container + thread)
  to reproduce mock unread flags. Seed dates: per-label year resolution
  (all 2024 except `'Mon, August 18'` → 2025, a Sunday/Monday mismatch),
  Europe/London. Desk *Open work* is not derivable from data → transitional
  per-user `deskOpenWork` table until Phase 4; screener previews are stored
  (bespoke text). Two extra avatar-less users (Carlos Rivera, Maya Patel)
  must be seeded — static huddle members reference them.
- 2026-07-08 — Two user rulings folded into the spec: (1) unread = the tail
  of a topic/DM since last visit — one readState watermark per container, no
  per-thread read state (a few contradictory mock flags render as unread;
  accepted). (2) Screener is the inbox for all incoming messages (urgent →
  Desk Urgent) with Add-to-Open-work / Later (snooze, reappears) / Dismiss;
  Open work is manually curated and kept until closed — stored per-user
  tables, not derived.
- 2026-07-08 — **No mock data in the real app**: production launches with an
  empty database; users exist only via sign-up (Phase 3). The seed script is
  demoted to an optional dev-only fixture for development/QA. Consequences:
  empty states are first-class UI on every surface (added to Phase 2 design
  work); the domain-model seed provisions (§1 extra users, §5 date strategy,
  per-table seed notes) apply to the fixture only — the client-side
  timestamp/date-label formatting rules in §5 remain production spec.
- 2026-07-08 — Phase 2 choices (user): Convex **cloud free plan** (not
  local anonymous); loading states are **skeleton placeholders** matching
  card/list layouts (design in Figma with tokens before building; empty
  states designed in the same pass).
- 2026-07-08 — **Product goal reaffirmed (user): the deliverable is the
  real from-scratch app** — log in as the first user, start in empty
  states, other users join and communicate. Remaining Phase 2 swaps
  proceed at pace (persistence is required for the goal regardless), then
  Phase 3 auth is the headline milestone, then Phase 4 multi-user.
  **Pixel-perfect remains a hard rule throughout** (user re-confirmed
  same day): UI fidelity is never traded for speed, seeded demo data
  keeps rendering exactly as designed via the seedKey bridges, and the §5
  formatting rules are production spec (they format real data).
- 2026-07-08 — Skeleton/empty design review rulings (user): (1) skeletons
  appear only when loading actually takes time — 150ms delayed reveal, no
  flash on fast loads; (2) loading keeps real chrome, only the data region
  skeletons; (3) Desk: Screener/Urgent sections hidden when empty, Open
  work/Starred always shown with their hint paragraphs (already
  implemented); (4) the purple beginning-banner shows in ANY topic with no
  conversations (was DM-promoted only — fixed) and in empty DMs without
  the Invite members button; (5) People list shows ALL people in the
  organization by default, conversation or not; (6) error states deferred
  to Phase 5.
- 2026-07-08 — Phase 1 seam built (5 commits, batch A–D + finalization).
  Deliberate behavior change: DM sent messages now live in the seam store
  and survive navigation (previously hook-local and lost — matches topics
  and the future backend). Deliberately preserved: DM composer still drops
  highlightType on send/reply (pre-seam behavior; revisit in Phase 2).
  Edge case: a date group whose messages are all deleted no longer renders
  a dangling date divider (seam filters empty groups).
