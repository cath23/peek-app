# Peek — Domain Model Spec

**Date:** 2026-07-08 · **Status:** Phase 0 deliverable of `PRODUCTION-PLAN.md`
**Source of truth for:** `convex/schema.ts` (Phase 2), the `src/api/` seam shapes
(Phase 1), and the seed script (`convex/seed.ts`).

This spec is derived from the entities implied by `src/data/*` (10 modules,
~1,900 lines), the runtime override layers in `src/lib/topicMutations.tsx` and
`src/lib/topicStore.tsx`, and the partition logic in `src/lib/threadPartition.ts`.

---

## 1. Identity — the "You" rule

There is no `'You'` author in the domain model. Every record carries a real
`userId`; "You" is a **render-time label** produced by
`authorId === currentUserId`.

- Until Phase 3 (auth), `currentUserId` is the hardcoded seed user's id,
  exposed by the seam (e.g. `useCurrentUser()`), never read from data rows.
- The seed user: display name **"Cath"** (trivially changeable — the name is
  almost never rendered because self-attribution shows "You"), the avatar
  currently at `src/assets/avatar.png`, role/email empty until Phase 3
  profiles.
- The mock people are seeded verbatim from `PEOPLE` (8 users). Two extra
  avatar-less users must also be seeded because static huddle members
  reference them by name: **Carlos Rivera** (`h9_2`) and **Maya Patel**
  (`h5_1`). Avatar rendering falls back to initials for them.

## 2. Tables

Conventions: Convex documents; `_id`/`_creationTime` implicit. `createdAt` is
an explicit `number` (ms since epoch) everywhere — we control it in the seed
(see §5), whereas `_creationTime` is insertion time. All string ids in mock
data (`t1_c1`, `dm1_c3`, numeric DM keys `1..7`, huddle ids `h3_1`) disappear;
the seed script keeps an in-memory old-id → new-`_id` map to rewire
cross-references (`seedMessageId`, reply keys, screener/star/desk targets,
attachment parents).

### 2.1 `users`

Replaces `PEOPLE` + the `'You'` literal + `AVATAR_BY_NAME`.

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | display name |
| `role` | `string?` | e.g. "Product Designer" |
| `avatarStorageId` | `Id<'_storage'>?` | Convex file storage; seeded from `src/assets/avatars/*` |
| `email` | `string?` | Phase 3 |
| `seedKey` | `string?` | stable key for idempotent seeding (`'alice'`, `'you'`, …) |

Indexes: `by_seedKey(seedKey)` (seed idempotency only).

### 2.2 `topics`

Replaces `TOPICS`.

| Field | Type | Notes |
|---|---|---|
| `title` | `string` | |
| `creatorId` | `Id<'users'>` | static topics: seeded as the author of the topic's first message |
| `createdAt` | `number` | |

`Topic.isResolved` is **not stored** — derived, see §4.1.
Indexes: none needed yet (topics list is "all topics").

### 2.3 `topicMembers`

Replaces `Topic.invitees?: string[]` (names → ids).

| Field | Type |
|---|---|
| `topicId` | `Id<'topics'>` |
| `userId` | `Id<'users'>` |
| `addedAt` | `number` |

Indexes: `by_topic(topicId)`, `by_user(userId)`.
Membership is what the members pill renders (creator + invitees). It is *not*
the same as participation — who has posted is derived from authorship.
Static topics seed no member rows (mocks have no `invitees`); runtime
`createTopicFromDm` writes creator + invitees.

### 2.4 `dmConversations`

Replaces the numeric keys of `DM_CONVERSATIONS` — this kills the `number` id
scheme.

| Field | Type | Notes |
|---|---|---|
| `userLowId` | `Id<'users'>` | the pair, canonically ordered (`userLowId < userHighId` lexicographically) |
| `userHighId` | `Id<'users'>` | |
| `createdAt` | `number` | |

Indexes: `by_pair(userLowId, userHighId)` (uniqueness enforced in the
mutation), `by_low(userLowId)`, `by_high(userHighId)` (list "my DMs" = union
of both until a better shape is needed).
Seed: numeric keys 1–7 → one doc each (You ↔ Alice/Daniel/Hallie/Greg/Juan/
Amie/Zack).

### 2.5 `messages` — **one table, polymorphic parent** (decision, see §3)

Replaces `ConversationData` rows in `TOPIC_CONVERSATIONS`, `DM_CONVERSATIONS`,
and huddle `conversation`/`extraConvs`.

| Field | Type | Notes |
|---|---|---|
| `parentKind` | `'topic' \| 'dm' \| 'huddle'` | |
| `parentId` | `string` | the parent's `_id` as a string (union of three `Id` types can't share one index; kind+id pair restores type safety in code) |
| `authorId` | `Id<'users'>` | |
| `body` | `string` | serialized composer format, verbatim from mocks |
| `createdAt` | `number` | |
| `urgent` | `boolean?` | was `isUrgent` |
| `highlightType` | `HighlightType?` | literal union unchanged (`'insight' \| 'concern' \| 'conclusion' \| 'question' \| 'summary'`); `HIGHLIGHT_META` stays a client-side presentation constant |
| `resolved` | `boolean?` | message-level resolution state |
| `resolvedById` | `Id<'users'>?` | was `resolvedBy` (name) |
| `resolutionMessage` | `string?` | |
| `resolvedByReplyId` | `Id<'replies'>?` | from `ResolvedOverride.resolvedByReplyId` — set when resolution was triggered by a `→ msg` reply; drives inline resolution editing on that reply card |
| `resolvedAt` | `number?` | new; needed for audit/ordering, costs nothing |
| `attachments` | `string[]?` | Figma **frame ids** (`'fg-frame-7'`); stays a plain string ref because `figmaData` stays static (§6). Becomes a real attachments table in Phase 5. |

Indexes: `by_parent(parentKind, parentId)` — the one query that matters;
order by `createdAt` in the query.

Editing a message body is an update of `body` (the `bodyOverrides` /
`huddleBodyOverrides` layers collapse into this). Deleting is a real delete
(the `deletedIds` layer disappears; "topic resolved" naturally recomputes).

### 2.6 `replies`

Replaces `ReplyData` / the `REPLIES` map.

| Field | Type | Notes |
|---|---|---|
| `messageId` | `Id<'messages'>` | replies already work identically across topic/DM/huddle parents — the mock `REPLIES` map is a single map keyed by message id across all three surfaces |
| `authorId` | `Id<'users'>` | |
| `body` | `string` | |
| `createdAt` | `number` | subsumes both `timestamp` (display) and `createdAtMs` |
| `urgent` | `boolean?` | e.g. `r_dm3c1_1` |
| `highlightType` | `HighlightType?` | |
| `attachments` | `string[]?` | frame ids, as on messages |

Indexes: `by_message(messageId)`.
`isNew` is not stored — derived from `readState` (§4.3).

### 2.7 `reactions` — per-user rows

Replaces the pre-aggregated `ReactionData {emoji, count, owner}`.

| Field | Type |
|---|---|
| `messageId` | `Id<'messages'>` |
| `userId` | `Id<'users'>` |
| `emoji` | `string` |
| `createdAt` | `number` |

Indexes: `by_message(messageId)`, `by_message_user(messageId, userId)`
(toggle = lookup + insert/delete; uniqueness of (message, user, emoji)
enforced in the mutation).
Reactions are message-level only, exactly as today (replies have no reactions
in the UI). If reply reactions ever ship, add `targetKind` then — not now.
Seed expansion: `{emoji: '🚀', count: 4, owner: 'yours'}` → 1 row for You +
3 rows for other users chosen deterministically (round-robin over `PEOPLE`
excluding the message author); `owner: 'others'` → no row for You.

### 2.8 `huddles`

Replaces `Huddle` in `TOPIC_HUDDLES` + the `createdHuddles`/`deletedHuddleIds`
layers.

| Field | Type | Notes |
|---|---|---|
| `topicId` | `Id<'topics'>` | |
| `state` | `'active' \| 'resolved'` | |
| `createdById` | `Id<'users'>` | new; "created by" + fallback for empty-huddle display |
| `createdAt` | `number` | |
| `originDmId` | `Id<'dmConversations'>?` | set when promoted from a DM |
| `promotedAt` | `number?` | real ms; subsumes both the display string and `promotedAtMs`; drives the "Started topic" divider partition |
| `seedMessageId` | `Id<'messages'>?` | the DM message the topic was started from; the huddle anchor renders above it, and it is the card preview for promoted huddles |

Indexes: `by_topic(topicId)`, `by_originDm(originDmId)`.

Dropped/derived from the mock shape:
- `members: string[]` → `huddleMembers` table (§2.9).
- `lastActivity` (display string) → derived: max `createdAt` over the
  huddle's messages and their replies, falling back to `huddle.createdAt`
  for empty huddles (§4.5).
- `conversation` (embedded seed message) → for ordinary huddles it is simply
  the huddle's **first message row** (`parentKind: 'huddle'`); for promoted
  huddles the preview is the message referenced by `seedMessageId`. The
  embedded-object shape disappears.
- `extraConvs` → messages with `parentKind: 'huddle'`.

### 2.9 `huddleMembers`

| Field | Type |
|---|---|
| `huddleId` | `Id<'huddles'>` |
| `userId` | `Id<'users'>` |

Indexes: `by_huddle(huddleId)`, `by_user(userId)`.

### 2.10 `readState`

Replaces the baked flags `hasNewMessage`, `hasNewReply`, `isNew`, `isUnread`.
Live per-user derivation lands in Phase 4, **but the table exists from
Phase 2** and the seed writes rows for the seed user such that the derived
flags reproduce the mock flags exactly (see §4.3 for why two granularities
are required).

| Field | Type | Notes |
|---|---|---|
| `userId` | `Id<'users'>` | |
| `targetKind` | `'container' \| 'thread'` | container = a topic, DM conversation, or huddle; thread = one message's reply thread |
| `targetId` | `string` | container `_id` or message `_id` |
| `lastReadAt` | `number` | |

Indexes: `by_user_target(userId, targetKind, targetId)`.

### 2.11 `stars`

Replaces `STARRED_ENTRIES`.

| Field | Type | Notes |
|---|---|---|
| `userId` | `Id<'users'>` | per-user from day one |
| `kind` | `'topic' \| 'dm'` | |
| `targetId` | `string` | topic or dmConversation `_id` |
| `createdAt` | `number` | list order |

Indexes: `by_user(userId)`.
The mock's `name`/`title`/`avatarSrc`/`topicStatus`/`isUnread` fields are all
derived at query time from the target.

### 2.12 `screenerItems`

Replaces `SCREENER_ITEMS`. This is a real per-user triage queue: rows are
created when something needs screening and deleted on triage — the *contents*
aren't derivable.

| Field | Type | Notes |
|---|---|---|
| `userId` | `Id<'users'>` | |
| `kind` | `'topic' \| 'dm'` | |
| `targetId` | `string` | topic or dmConversation `_id`. **Schema fix:** the mock DM item (`sc_2`) has only `authorName` and no DM reference; the seed maps Amie Miles → her DM conversation. |
| `preview` | `string` | stored. The mock previews are bespoke narrative summaries, not any message's body — they cannot be derived (and no AI). Whatever creates a screener row supplies the preview. |
| `createdAt` | `number` | |

Indexes: `by_user(userId)`.

### 2.13 `deskOpenWork` — transitional

The mock `OPEN_WORK_ITEMS` (topics 2 and 3) is **not derivable** from the
data: You have posted in unresolved topics 1, 6, 8 (and starred topic 1),
none of which appear in Open work. It is a curated list. Until Phase 4
defines a real derivation (candidate rule: unresolved topics where the viewer
is a member or has posted, minus explicit dismissals), Open work is stored:

| Field | Type |
|---|---|
| `userId` | `Id<'users'>` |
| `topicId` | `Id<'topics'>` |
| `order` | `number` |

Indexes: `by_user(userId)`. Flagged for deletion in Phase 4.
`title`, `topicStatus`, `isUnread` are derived from the topic. The Desk
**Urgent** section, by contrast, is fully derived (§4.4) and gets no table.

## 3. Decision — message unification: **one `messages` table**

One table with `{parentKind, parentId}` wins over per-surface tables.
Grounds, checked against the two edge cases the plan calls out:

**Evidence from the mocks themselves.** `ConversationData` is already one
shape shared by topics, DMs, and huddles; `REPLIES` is already one map whose
keys span all three surfaces (`t1_c1`, `dm1_c3`, `h1_1_c1`); the same
components (`ConversationCard`, `ThreadPanel`, the shared view hooks) render
all three. Per-surface tables would split identical data three ways and force
three-way unions back at every read site.

**Edge case 1 — huddle promotion.** A promoted huddle displays the origin
DM's messages above the "Started topic" divider and huddle-posted messages
below it. With one table this is two reads on the same index —
`by_parent('dm', originDmId)` + `by_parent('huddle', huddleId)` — returning
the same row type; the divider is a pure `createdAt < promotedAt` partition
(today's `threadPartition.ts` special-cases "static replies have no
`createdAtMs`" — that hack disappears because every row has a real
`createdAt`). Messages are **never copied or moved** at promotion: promotion
writes one `topics` row, one `huddles` row (`originDmId`, `promotedAt`,
`seedMessageId`), and membership rows. With per-surface tables, promotion
would need either bulk-copying rows across tables (destroying reply/reaction
foreign keys) or cross-table reads returning different types.

**Edge case 2 — resolution by reply.** `resolvedByReplyId` links a message's
resolution to the reply that triggered it (`→ msg` from the thread panel),
and the inline-resolution editor must find it from either end. Resolution
exists on topic messages *and* huddle messages in the mocks (`h1_1_c1` is
resolved), and a promoted huddle can resolve what is physically a DM-parented
message. One table = one field + one code path; three tables = the same
resolution fields duplicated three times and the reply-side lookup needing to
know which table its parent lives in.

Cost accepted: `parentId` is a `string` rather than a typed `v.id(...)`
(a union of three id types can't share one index). The `{parentKind,
parentId}` discriminated pair restores safety at the seam boundary.

## 4. Derivation rules — derived, never stored

### 4.1 Topic resolved

Verbatim from `topicMutations.isTopicResolved` (already the app-wide source
of truth): a topic is resolved iff it has **at least one** message and
**every** message with `parentKind: 'topic'` and this `parentId` has
`resolved === true`. Moves into a Convex query. `Topic.isResolved` is dropped
from storage — verified consistent with the mocks: topics 4 and 5 (static
`isResolved: true`) have all messages resolved; all other topics have ≥ 1
unresolved message, so the derived value reproduces every static flag.

### 4.2 Reply count

`replyCount = count(replies by_message)`. Never stored (mock `replyCount` and
`h3_1_e2`'s explicit `0` are seed-verification checksums, nothing more).

### 4.3 Unread (message `hasNewMessage`, reply `isNew`, container dot,
`hasNewReply`)

Two watermark granularities are required — one per-container watermark cannot
reproduce the mocks (e.g. topic 2: the 'Just now' reply under `t2_c5` is
unread while the *later* Aug 30 messages `t2_c6`/`t2_c7` are read; topic 6:
`t6_c8` is unread while its own replies, sent later, are read).

- A **message** is new for user *u* iff
  `authorId ≠ u` and `createdAt > lastReadAt` of *u*'s `container` row for
  its parent (missing row = everything read is *not* assumed — missing row
  means never opened; seed always writes container rows).
- A **reply** is new for *u* iff `authorId ≠ u` and `createdAt > lastReadAt`
  of *u*'s `thread` row for its message, **falling back** to the container
  row when no thread row exists.
- `hasNewReply(message)` = any of its replies is new.
- **Container unread dot** (`topicHasUnread` / `dmHasUnread`, verbatim
  incl. the urgency carve-out): unread iff any **non-urgent** message is new
  or has a new reply. Urgent unreads surface via the Urgent section /
  warning pill instead, never the accent dot.
- Marking read = upserting `lastReadAt = now` on the appropriate row(s).

Phase 2 seeds watermarks for the seed user that reproduce every mock flag;
Phase 4 makes the writes live for everyone.

### 4.4 Desk

- **Urgent section** (`URGENT_ITEMS` — dropped entirely): derived — DMs and
  topics containing at least one urgent message or urgent reply that is
  unread for the viewer (per §4.3). Reproduces the mock: DM 2 (`dm2_c5`
  urgent+new) and DM 3 (`r_dm3c1_1` urgent+new).
- **Open work**: stored per-user until Phase 4 (§2.13).
- Titles, avatars, `topicStatus`, unread dots on all desk/starred rows:
  derived from the target at query time.

### 4.5 Huddle card

- `lastActivity` = max `createdAt` over the huddle's messages and their
  replies (for promoted huddles: over the origin DM's messages too), falling
  back to `huddle.createdAt`. Rendered with the §5 date-label rules —
  verified to reproduce every mock string (`h2_1` → 'Thu, August 29',
  `h3_1` → 'Today', empty `h5_1`/`h9_2` → 'Today').
- Card preview = `seedMessageId`'s message when promoted, else the huddle's
  first message, else the empty state.

### 4.6 Reaction aggregation

Query groups rows by emoji → `{emoji, count: n, mine: ∃ row with
userId = viewer}`; ordering by first reaction's `createdAt`. The seam maps
`mine` onto today's `owner: 'yours' | 'others'` presentation shape so
components don't change in Phase 1.

## 5. Decision — seed-date strategy

Everything below lives in the seed script + one client-side formatting module
(the display strings are pure functions of `createdAt`).

**Timezone.** Seed times are constructed in **Europe/London** (the narrative
says "5pm UK time"). Stored as UTC ms. Rendering always uses the viewer's
local timezone — labels are mock-identical when viewed in Europe/London,
which is the demo condition.

**Anchor.** `anchor` = the moment the seed runs.

**Fixed labels** (`'Mon, September 2'`, …): resolved to the **most recent
date before (anchor − 2 days) whose weekday + month + day all match the
label**, scanning back year by year. This reproduces every label verbatim.
Resolution for the current dataset (anchor in 2026): every fixed label lands
in **2024** except `'Mon, August 18'` (topic 3), which is a *Sunday* in 2024
and lands on **2025-08-18** (a Monday). Nothing renders the year and nothing
compares dates across topics, so the year split is invisible; the
per-label rule keeps all rendered strings pixel-identical. Clock times
(`'9:14 AM'`) are parsed onto that date in Europe/London.

**Relative labels.**
- `'Today'` group → anchor's calendar day, clock times as given.
- `'Yesterday'` group → anchor − 1 day.
- `'Just now'` rows (`r_t2c5_2`, `r_dm3c1_1`, `r_dm5c2_2`) → anchor − 45 s
  (regardless of which day their mock group sat in — "just now" must be just
  now).
- Caveat, accepted: 'Today' mock times run to ~4:30 PM, so a seed run in the
  morning creates a few hours of future-dated rows until the clock catches
  up; and relative labels decay as real days pass. Both are correct app
  behavior for real data; **re-run the seed to refresh the demo dataset.**

**Formatting rules** (client-side, replacing stored `timestamp`/`dateLabel`):
- Timestamp on cards: `'Just now'` if `now − createdAt < 60 s`, else
  `h:mm AM/PM` (no leading zero, as `topicStore.formatTime` already does).
- Date-group label (grouping = by local calendar day, one group per day in
  order): `'Today'`, `'Yesterday'`, else `'EEE, MMMM d'` (`'Mon, September
  2'`). No year is ever shown, matching the mocks.
- Huddle `lastActivity` and the promotion divider's `promotedAt`
  (`'September 2'` = `'MMMM d'`, per `topicStore.formatPromotedAt`) use the
  same primitives.

**Reaction/readState seeding** follows §2.7 and §4.3 so derived aggregates
and unread flags equal the mock values; `replyCount` in the mocks doubles as
a checksum the seed script asserts against.

## 6. Static reference data — stays mocked, behind the seam

Per the plan (decision 2026-07-08): `filesData.ts`, `figmaData.ts`,
`linearData.ts` mock third-party integrations (GitHub/Figma/Linear) and are
**unchanged** — no tables. They move behind `src/api/` (`useFiles()`,
`searchFigmaFrames()`, `searchLinearIssues()`, `frameById()`,
`linearIssueByKey()`, `frameBreadcrumb()`) so real integrations can swap in
later. Message/reply `attachments` reference them by frame id (§2.5).

## 7. Coverage check — every export of `src/data/*`

Legend: **table** = becomes stored field/row · **derived** = computed in a
query or client formatting · **static** = stays mock behind the seam ·
**dropped** = ceases to exist (listed with its replacement).

### peopleData.ts
| Export / field | Fate |
|---|---|
| `Person.id` | table — `users._id` (`seedKey` keeps the old slug) |
| `Person.name`, `.role`, `.avatarSrc` | table — `users.name/role/avatarStorageId` |
| `PEOPLE` | seed input (8 users; +You, +Carlos Rivera, +Maya Patel per §1) |
| `AVATAR_BY_NAME`, `avatarFor(name)` | **dropped** — avatars resolve by `userId` through the seam |
| `'You'` avatar alias | **dropped** — §1 identity rule |

### topicData.ts
| Export / field | Fate |
|---|---|
| `Topic.id` | table — `topics._id` |
| `Topic.title` | table |
| `Topic.isResolved` | **dropped** — derived §4.1 |
| `Topic.invitees` | table — `topicMembers` rows |
| `HighlightType` | kept — literal union in schema + client |
| `HIGHLIGHT_META` | static — client presentation constant (uses design tokens) |
| `ReactionData.emoji` | table — `reactions.emoji` |
| `ReactionData.count`, `.owner` | **dropped** — derived §4.6 from per-user rows |
| `ConversationData.id` | table — `messages._id` |
| `ConversationData.authorName` | table — `messages.authorId` (name→id) |
| `ConversationData.timestamp` | **dropped** — derived from `createdAt` §5 |
| `ConversationData.body` | table — verbatim |
| `ConversationData.reactions` | table — `reactions` rows |
| `ConversationData.replyCount` | **dropped** — derived §4.2 (seed checksum) |
| `ConversationData.hasNewMessage`, `.hasNewReply` | **dropped** — derived §4.3 via `readState` |
| `ConversationData.isUrgent` | table — `messages.urgent` |
| `ConversationData.highlightType` | table |
| `ConversationData.isResolved`, `.resolvedBy`, `.resolutionMessage` | table — `resolved`, `resolvedById` (name→id), `resolutionMessage` |
| `ConversationData.attachments` | table — `messages.attachments` (frame ids, §6) |
| `ConvGroup`, `.dateLabel` | **dropped** — grouping is client-side by calendar day §5 |
| `TOPIC_CONVERSATIONS` | seed input |
| `topicHasUnread()` | derived — §4.3 container rule |

### replyData.ts
| Export / field | Fate |
|---|---|
| `ReplyData.id` | table — `replies._id` |
| `ReplyData.authorName` | table — `replies.authorId` |
| `ReplyData.timestamp` | **dropped** — derived from `createdAt` |
| `ReplyData.body` | table |
| `ReplyData.isNew` | **dropped** — derived §4.3 thread rule |
| `ReplyData.isUrgent` | table — `replies.urgent` |
| `ReplyData.highlightType` | table |
| `ReplyData.attachments` | table |
| `ReplyData.createdAtMs` | **dropped** — subsumed by `createdAt` (real ms everywhere kills the "static replies sort before runtime replies" special case in `threadPartition.ts`) |
| `REPLIES` | seed input |

### dmData.ts
| Export / field | Fate |
|---|---|
| `DM_CONVERSATIONS` numeric keys | **dropped** — `dmConversations` docs §2.4 |
| values (`ConvGroup[]`) | same mapping as topicData's `ConversationData`/`ConvGroup`, with `parentKind: 'dm'` |
| `dmHasUnread()` | derived — §4.3 |

### huddleData.ts
| Export / field | Fate |
|---|---|
| `Huddle.id` | table — `huddles._id` |
| `Huddle.topicId` | table |
| `Huddle.members` | table — `huddleMembers` rows (names→ids) |
| `Huddle.state` | table |
| `Huddle.lastActivity` | **dropped** — derived §4.5 |
| `Huddle.conversation` | **dropped** as embed — first huddle message / seed message §2.8 |
| `Huddle.extraConvs` | table — messages with `parentKind: 'huddle'` |
| `Huddle.originDmId` | table — `Id<'dmConversations'>` |
| `Huddle.promotedAt` (string), `.promotedAtMs` | table — single `promotedAt: number` |
| `Huddle.seedMessageId` | table — `Id<'messages'>` |
| `TOPIC_HUDDLES` | seed input |
| `getHuddleByOriginDm()`, `getOriginHuddleForTopic()` | derived — queries on `by_originDm` / `by_topic` |

### deskData.ts
| Export / field | Fate |
|---|---|
| `OpenWorkItem.topicId` | table — `deskOpenWork` (transitional §2.13) |
| `OpenWorkItem.title`, `.topicStatus`, `.isUnread` | **dropped** — derived from the topic |
| `UrgentItem` (whole type) | **dropped** — fully derived §4.4 |
| `StarredEntry.kind`, target ids | table — `stars` §2.11 |
| `StarredEntry.name`, `.title`, `.avatarSrc`, `.topicStatus`, `.isUnread` | **dropped** — derived from target |
| `URGENT_ITEMS`, `OPEN_WORK_ITEMS`, `STARRED_ENTRIES` | seed input (urgent items only verified, not seeded) |

### screenerData.ts
| Export / field | Fate |
|---|---|
| `ScreenerItem` topic variant | table — `screenerItems` §2.12 |
| `ScreenerItem` dm variant (`authorName`, no id!) | table — schema fix: `targetId` required; seed maps Amie → her DM |
| `.topicTitle`, `.authorAvatarSrc` | **dropped** — derived from target |
| `.preview` | table — stored (bespoke narrative text, not derivable) |
| `SCREENER_ITEMS` | seed input |

### filesData.ts / figmaData.ts / linearData.ts
All exports (`APP_CATEGORIES`, `APP_FILES`, `DOCUMENT_FILES`, `FIGMA_FRAMES`,
`FrameKind`, `FrameArtVariant`, `frameById`, `frameBreadcrumb`,
`searchFigmaFrames`, `LINEAR_ISSUES`, `LinearStatus`, `linearIssueByKey`,
`searchLinearIssues`): **static** behind the seam §6.

### Runtime state (src/lib) — where each override layer goes
| `topicMutations` layer | Fate |
|---|---|
| `sentMessages`, `huddleSentMessages` | `messages` inserts |
| `sentReplies` | `replies` inserts |
| `deletedIds`, `deletedHuddleIds` | real deletes |
| `bodyOverrides`, `huddleBodyOverrides` | `messages.body` updates |
| `resolvedOverrides` (+`resolvedByReplyId`) | `messages` resolution fields |
| `highlightOverrides` | `messages.highlightType` updates |
| `createdHuddles` | `huddles` + `huddleMembers` inserts |
| `reactionOverrides` | `reactions` toggle mutation |
| `isTopicResolved()` | derived query §4.1 |
| `topicStore.createTopicFromDm` | one mutation: insert topic + members + promoted huddle (§3 edge case 1) |
| `topicStore` id/format helpers (`nextTopicId`, `formatTime`, …) | **dropped** — Convex ids + §5 formatting module |

## 8. Open questions (tracked, non-blocking)

1. **Seed user display name** — "Cath" default (§1); becomes editable with
   Phase 3 profiles.
2. **Open-work derivation rule** — Phase 4 decision; transitional table until
   then (§2.13).
3. **Screener row provenance** — what creates screener rows for real
   multi-user traffic (mention? first message in an unjoined topic?) is a
   Phase 4 product decision; the table shape above doesn't depend on it.
