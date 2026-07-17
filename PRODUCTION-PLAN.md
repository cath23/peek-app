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
- [x] **Entity swap 8 — stars/screener/open-work** (2026-07-08):
      `convex/desk.ts` — starsList/toggleStar (create-on-demand DM for
      first star on a conversation-less person), screenerList (snoozed
      filtered)/dismiss/snooze, openWorkList/remove, **and urgentList
      derived per §4.4 ahead of schedule** (urgent message OR unread reply
      on one, newer than the readState watermark — verified pixel-equal to
      the mock Urgent list, and empty in a fresh workspace). Seam:
      StarredProvider Convex-backed with an optimistic toggle overlay
      (+isLoading); useScreenerItems/useDeskItems/useDeskLoading;
      DeskPage wires remote dismiss/snooze/remove ("Later" now actually
      snoozes 24h — it was unwired), sidebar skeletons on Desk/People
      while lists load
- [x] **Phase 2 close-out** (2026-07-08): the override providers are NOT
      deleted — they are permanent dual-role infrastructure (see decision
      log): mock-mode source of truth (tests/Storybook/demo instance) +
      Convex-mode optimistic window. Deleted/fixed instead: the dead
      MOCK_TOPICS invitees bridge (seeded mock topics define no invitees),
      the dead `attachments`/`replyCount` mock fallbacks in
      `toConversationData` (the server always provides both);
      `useThread` now prefers the persisted row over the mock copy
      (fixes stale thread-panel body/highlight after a prior-session
      edit — runtime-verified via server-side divergence);
      `useReplyCount` returns the server-derived count in Convex mode
      (consistent with the cards); `seedKey` re-documented as the
      permanent stable-client-key convention (schema + all convex
      modules); stale "Phase 2 swaps…" seam headers rewritten.
      Sweep: `tsc -b` + `tsc -p convex` + 93 tests + Storybook build +
      headless-Chrome runtime pass against the live deployment (recipe
      persisted at `.claude/skills/verify/SKILL.md`) — all green.
      App runs entirely on Convex with the hardcoded seed user.
- [ ] QA checklist regression pass (manual visual — user; incl. the
      deferred Phase 1 pass)

### Phase 3 — Auth + profiles *(decisions locked 2026-07-09 — see log)*
- [x] Backend (2026-07-09): `@convex-dev/auth` + Password provider;
      authTables merged into `users` (auth fields added, name stays
      required, email/phone/by_seedKey indexes); `convex/otp.ts` =
      verify + reset providers (8-digit codes via Resend raw fetch,
      **dev fallback logs the code when RESEND_API_KEY is unset**);
      JWT_PRIVATE_KEY/JWKS/SITE_URL set on dev; seed wipe now covers
      the auth tables (else wiping users orphans accounts)
- [ ] **USER STEP — Resend account + API key** → `RESEND_API_KEY` env
      var on the dev deployment (test sender only delivers to the
      account owner's address — fine for dev; verified domain = Phase 5)
- [x] Client (2026-07-09): `ConvexAuthProvider` in the seam store;
      `AuthGate` in main.tsx (AuthLoading → delayed pulsing wordmark,
      Unauthenticated → AuthScreen, mock mode auto-signed-in — 93 tests
      + Storybook unaffected)
- [x] Auth screens (2026-07-09): sign-in / sign-up (email + password +
      full name) / verify-email / forgot + reset, one centered card,
      Field/TextInput/Button primitives, friendly error mapping;
      `PeekLogo` wordmark component (currentColor + `--logo` token:
      brand purple on light, white on dark — user-provided asset).
      Runtime-verified headless end-to-end: gate, sign-up → code from
      logs → verified → app renders; unverified sign-in re-prompts
      verification; wrong password shows friendly error; both themes
      screenshotted
- [x] Identity swap (2026-07-09): `convex/users.ts` viewer helpers
      (getAuthUserId) + `users.me`; every function swapped off the
      hardcoded 'you' identity — mutations throw signed-out, queries
      return empty; reactions/urgent/stars/screener/open-work per-viewer;
      `dev/seedDemo:seedWithLogin` creates the pre-verified demo login
      (demo@peek.dev / Peek-demo-1) as seed-user Cath then seeds
- [x] "You" sweep (2026-07-09): rows carry real names + authorId /
      resolvedById / memberIds; the seam's `useCurrentUser()` compares
      ids client-side and renders the viewer's own rows as the 'You'
      label — components keep the label contract (pixel-identical,
      runtime-verified as both the demo user and a fresh sign-up).
      Avatar falls back to a generic silhouette for unknown users
      (ruling); known gap: the viewer's own avatar still resolves to
      the mock portrait until profile uploads land
- [x] Profile (2026-07-09): `ProfileDialog` from the avatar menu — edit
      name + role, upload/remove avatar (real Convex file storage:
      `generateAvatarUploadUrl` → POST → `setAvatar`; ≤5 MB, images
      only). Email is read-only (it's the sign-in identity). Sign-out +
      identity already in that menu; avatar button got an accessible
      name ("Account menu").
- [x] Avatar registry (2026-07-09): one lookup for the whole app —
      **uploaded avatar > seeded demo portrait > silhouette**. It's a
      context with a MOCK DEFAULT (`src/api/avatars.tsx`), so `Avatar`
      stays a dumb primitive and Storybook/tests render with no provider
      exactly as before. Fixes the known gap: a real sign-up no longer
      borrows the demo fixture's portrait for their own messages.
      Screener/Desk/Starred DM avatars route through it too.
      Runtime-verified: fresh user = silhouette → upload propagates
      live to top bar + message cards + People; demo user unaffected.
- [ ] **USER STEP — instances**: two Convex prod deployments + two
      Vercel apps — `peek-demo` (seeded + demo login) and
      `peek-develop` (empty; the real app)

### Phase 4 — Multi-user *(2026-07-09)*
- [x] **DM identity (§2.4)** — a DM is addressed by the PARTNER's person
      key; the server resolves the canonical (viewer, partner) pair on
      `by_pair`. Fixes a cross-talk/privacy bug: PeoplePage minted DM ids
      as `100 + index of the viewer's People list` but stored them as a
      GLOBAL key, so with 3+ users B's DM to C could resolve to A's
      conversation with C. Synthetic ids gone; `/people/1` → `/people/alice`.
      Verified with three real users in three browsers: same key for C from
      both senders, separate conversations, no leak either way — and live
      sync with no reload.
- [x] **readState (§4.3)** — TWO watermarks, revising the earlier
      "one per container" ruling: opening a topic/DM (after a 1.5s dwell)
      clears `hasNewMessage`; only opening a message's thread panel clears
      `hasNewReply`/`isNew`. All three derived per viewer; the mock unread
      bridge is gone. Unread dots on by default (they were a debug toggle
      while fake).
- [x] **Screener auto-fill (§2.12)** — DMs to you; topics you were added to
      but never opened; @mentions (membership not required). One row per
      conversation, refreshed not duplicated. Urgent (`!@`) diverts to Desk
      Urgent and never screens. "Later" survives a refresh. Hover a row →
      preview card with the triggering message + recent replies.
- [x] **@mentions** suggest real workspace people (were a static mock list);
      the seam feeds the Tiptap plugins a directory snapshot and rebuilds
      the render-time regex.
- [x] **Reaction cross-user sync (QA batch #2 pre-work, 2026-07-16)** —
      reactions are server-driven in Convex mode. The seam used to set a
      permanent full-array `reactionOverrides[id]`, which masked the server
      aggregate forever: after your first reaction you never saw anyone
      else's, and 2nd-emoji / join-existing / remove toggles diffed against
      the stale override. Now the cards pass the toggled emoji through
      `onReactionsChange`, and the seam records a per-emoji pending toggle
      (the optimistic window, applied idempotently on top of the server
      aggregate) that clears when `toggleReaction` settles. Mock mode and
      reply reactions keep the full-array override. Verified two-browser:
      2nd emoji, joining another user's reaction, removing your own
      (including pill removal at count 0).
- [x] **QA batch #2, items 1–3 (2026-07-16)** — (1) *Sidebar dots for
      replies*: `unread.summary` no longer skips your own messages wholesale
      (a reply to YOUR message now dots the sidebar), and huddle
      messages/replies roll up to the parent topic's dot and urgent
      indicator (member-gated — huddles are private). (2) *Screener*: a
      reply also screens to thread PARTICIPANTS (you wrote the parent
      message or an earlier reply), extending the mention-only rule.
      (3) *Urgent is per-item*: a non-urgent reply on an urgent thread
      raises the ordinary dot, not the urgent flag — the sender must `!@`
      again (`desk.urgentList` + `unread.containerFlags`; urgent replies
      now judged against the THREAD watermark). Desk: removing the
      selected Open-work item clears the stale selection → empty state.
      All verified two-browser (.verify-qa2a.mjs, 13 checks).
- [x] **QA batch #2, item 4 — `[` command (2026-07-16)**: the composer's
      topic/file-reference popup now suggests REAL topics via a seam
      directory snapshot (`mentionTopics` + `TopicDirectorySync`, same
      pattern as @mentions; includes runtime-created topics). In Convex
      mode the mock Apps/Documents entries are dropped — files aren't
      implemented, and the app never offers a reference that can't
      resolve; FilesMenu hides the Apps drill-in when no app items exist.
      Mock mode (Storybook/demo) unchanged. Verified (.verify-qa4.mjs).
- [x] **QA batch #2, items 5–6 (2026-07-17)** — (5) *V3 unified stream
      interleaves huddles by date*: huddle cards slot into their day group
      at their chronological position (`lastActivityMs ?? promotedAtMs` vs
      message `createdAtMs`, both newly carried through the seam), and day
      groups sort chronologically — huddle-only dates no longer trail
      after "Today". Mocks without timestamps keep the old ordering
      (Storybook parity). (6) *Members pill is real*: `useTopicMessages`
      resolves the topic through the Convex-aware lookup, so topics
      created by OTHER users show their true member count + avatar stack;
      posting a message or reply into a topic now inserts a `topicMembers`
      row server-side (`ensureTopicMember`), keeping membership consistent
      for every user. `topics.join` mutation added (used by item 7's Join
      banner). Verified two-browser (.verify-qa56.mjs, 9 checks).
- [x] **QA batch #2, items 7–8 (2026-07-17)** — (7) *Topic access, per the
      2026-07-16 ruling*: the Topics sidebar splits into "Your topics" /
      "Other topics" (collapsible headers, StarredSection style; flat list
      when everything is yours — mock parity). Opening a non-member topic
      shows its content as usual plus a JoinTopicBanner (NewTopicBanner
      visual) above the composer; Join calls `topics.join`, the banner
      clears and the topic moves sections reactively. (8) *Delete topic*:
      the topic row's 3-dot opens a more-menu with a destructive "Delete
      topic" item → `topics.remove` cascades messages, replies, reactions,
      huddles + huddle members, topicMembers, screener/open-work/star rows,
      and readState watermarks; optimistic local hide + selection/URL
      cleanup. ALSO fixed per user report: a huddle's stream position now
      anchors on when its SEED message was SENT (`conversation.createdAtMs`
      → promotedAtMs → lastActivityMs), so a DM-promoted huddle sits above
      later messages instead of sinking to the bottom (lastActivity was
      promotion-time based). Verified two-browser (.verify-qa78.mjs, 11
      checks).
- [ ] Manual two-browser QA pass (user)

### Phase 5 — Hardening *(coarse)*
- [x] **Prod deploy + env wiring** (2026-07-17) — QA batch #2 live: `git
      push` (Vercel peek-demo + peek-develop) + `npx convex deploy -y`
      (prod patient-grouse-611).
- [x] **Error boundaries** (2026-07-17) — `ErrorBoundary` (class) wraps the
      root (last-resort, in main.tsx) and each AppShell slot (list /
      conversation / thread), so a crashing card or panel degrades to an
      inline "Something went wrong — try again" fallback instead of
      white-screening. "Try again" re-mounts just that subtree. Unit-tested
      (ErrorBoundary.test.tsx, 3 cases).
- [x] **Message pagination** (2026-07-17) — `messages.list` takes an
      optional `limit` and returns `{ rows, hasMore }`, slicing to the
      NEWEST N BEFORE the per-message shaping (the expensive part). The seam
      (`useTopicMessages`/`useDmMessages`) starts at 100 and grows a page at
      a time; both views render a "Show earlier messages" button and keep
      the viewport anchored on the same message as older content extends
      upward (distance-from-bottom invariant; holds across Convex's
      load-time query collapse). Dev fixture `dev/bulk:bulkMessages` seeds
      bulk rows. Verified (.verify-p5.mjs, 12 checks).
- [x] **Invite members** (2026-07-17) — closes the empty-topic banner TODO:
      the banner's "Invite members" button opens `InviteMembersDialog`
      (PersonChipInput, StartHuddleDialog shell) → `topics.addMembers`
      (`ensureTopicMember` per name); optimistic `addInviteesLocal` in the
      topic store. Verified in .verify-p5.mjs.
- [ ] Uploads · email verification (deferred from Phase 3) · DM-row menu
      (left inert by ruling 2026-07-17)

### Decision log
- 2026-07-16 — **QA batch #2 rulings (user)**. (1) Screener: new replies in
  threads you STARTED or PARTICIPATED IN create/refresh a Screener item, in
  addition to the mention rule. (2) Urgency belongs to the individual
  message/reply: a non-urgent reply on an urgent thread must NOT keep it
  urgent — it raises the normal unread dot; re-urging requires a fresh `!@`.
  (3) Topic access: no content gating — the Topics list splits into two
  sections (topics you're a member of / the rest); opening a non-member
  topic shows its content plus a join banner (empty-topic banner style) at
  the bottom.
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
- 2026-07-09 — **Phase 4 rulings (user)**. (1) **Unread has two signals and
  they clear independently** — this REVISES the 2026-07-08 "one readState
  watermark per container": a first message becomes read when you open the
  topic/DM and linger a second or two; a new REPLY only becomes read when
  you open that message's thread panel. Two watermarks (container + thread).
  (2) **Screener rules**: all DMs to you; topics you were just added to that
  have a new message; anything that mentions you. Mentioned + urgent → Urgent
  section, not the Screener. New replies in a thread you were mentioned in
  refresh that Screener item. NOT every message/reply — "the Screener is just
  a preview". (3) One row per conversation, never duplicated. (4) Hovering a
  Screener row shows a **new hover card** with more of the thread/message.
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
- 2026-07-08 — **The demo dataset is kept permanently** (user request):
  `src/data/` mocks + `convex/dev/seedDemo.ts` are never deleted by the
  Phase 2 close-out — they are the pixel-perfect visual reference, the
  test/Storybook fixture, and the loader for a future standalone **demo
  instance** (separate Convex deployment + seed; recipe in HOW-TO-RUN.md).
  The real app still launches empty.
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
- 2026-07-08 — **Phase 2 close-out ruling**: the override providers and the
  mock read path are NOT deleted — the "demo dataset kept permanently"
  decision makes the dual-mode seam permanent. Without a deployment the
  providers + `src/data` mocks are the full source of truth (unit tests,
  Storybook fixtures, future demo instance); with one they cover only the
  optimistic window. `seedKey` is likewise permanent: the stable client key
  shared by demo-seed ids and client-generated optimistic ids. Close-out
  therefore = delete dead transitional bridges + make the persisted row
  authoritative in every Convex read (incl. the thread panel) + doc truth.
  Still bridged from mocks by design: seeded unread flags (`hasNewMessage`/
  `hasNewReply`/`isNew` — Phase 4 readState) and reply reactions
  (session-local; reactions table is message-keyed).
- 2026-07-08 — **Phase 3 auth rulings (user)**: no Figma design pass for
  the auth flows — login/profile UI is built directly in code. Email +
  password only as the first step; **no Google OAuth initially** (may be
  added later).
- 2026-07-09 — **Phase 3 decisions (user)**: sign-up collects email +
  password + full name (role/avatar later in profile). Email
  verification AND password reset ship now (Resend, OTP codes) — not
  deferred. Login/sign-up = centered-card layout on the app's dark
  canvas. Two instances: **peek-demo** (seeded demo dataset + demo
  login) and **peek-develop** (empty DB, real sign-ups — pushed to
  Vercel as the real app); "demo"/"develop" naming lives in the Vercel
  URLs, Convex deployment names are auto-generated.
- 2026-07-09 — **Simplification ruling (user: "too complex")** —
  supersedes the two 2026-07-09 items above where they conflict:
  (1) email verification + password reset DEFERRED to Phase 5 (they
  require an email service; OTP flows live in git history at 737a9fb) —
  sign-up goes straight in; "Forgot password?" hidden until then.
  (2) **peek-demo carries NO login and NO backend**: it is the
  mock-mode static build (no `VITE_CONVEX_URL`), opening directly into
  the demo dataset — the prototype experience, session-local writes.
  (3) **peek-develop** = the real app on the Convex **prod** deployment
  `patient-grouse-611` (created + JWT/SITE_URL configured 2026-07-09,
  empty DB), free plan. Vercel projects are the remaining user step
  (recipe in HOW-TO-RUN.md). Sign-out + identity added to the top-bar
  avatar menu. Empty-string VITE_CONVEX_URL now counts as absent.
- 2026-07-08 — Phase 1 seam built (5 commits, batch A–D + finalization).
  Deliberate behavior change: DM sent messages now live in the seam store
  and survive navigation (previously hook-local and lost — matches topics
  and the future backend). Deliberately preserved: DM composer still drops
  highlightType on send/reply (pre-seam behavior; revisit in Phase 2).
  Edge case: a date group whose messages are all deleted no longer renders
  a dangling date divider (seam filters empty groups).
