/**
 * Convex schema — generated from PRDs/Peek-Domain-Model.md §2 (Phase 0).
 * Field-level rationale, derivation rules, and the coverage check against
 * the old mock shapes live in that document; keep the two in sync.
 *
 * Production starts EMPTY (decision 2026-07-08); convex/dev/seedDemo.ts is
 * the optional dev-only fixture.
 */
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export const highlightType = v.union(
  v.literal('insight'),
  v.literal('concern'),
  v.literal('conclusion'),
  v.literal('question'),
  v.literal('summary'),
)

/** Polymorphic message parent — one messages table (domain model §3). */
export const parentKind = v.union(v.literal('topic'), v.literal('dm'), v.literal('huddle'))

/** Star / screener / desk targets. */
export const containerKind = v.union(v.literal('topic'), v.literal('dm'))

export default defineSchema({
  // §2.1 — replaces PEOPLE + the 'You' literal + AVATAR_BY_NAME
  users: defineTable({
    name: v.string(),
    role: v.optional(v.string()),
    avatarStorageId: v.optional(v.id('_storage')),
    email: v.optional(v.string()),
    /** Stable key for idempotent seeding ('you', 'alice', …). Fixture-only. */
    seedKey: v.optional(v.string()),
  }).index('by_seedKey', ['seedKey']),

  // §2.2 — isResolved is DERIVED (§4.1), never stored
  topics: defineTable({
    title: v.string(),
    creatorId: v.id('users'),
    createdAt: v.number(),
    /** Mock id ('1'..'9') — transitional bridge for the entity-by-entity
     *  swap, so partially-swapped entities can join mock-keyed data.
     *  Fixture-only; absent on real records; dropped when Phase 2 ends. */
    seedKey: v.optional(v.string()),
  }),

  // §2.3 — invitees; membership drives the members pill, not participation
  topicMembers: defineTable({
    topicId: v.id('topics'),
    userId: v.id('users'),
    addedAt: v.number(),
  })
    .index('by_topic', ['topicId'])
    .index('by_user', ['userId']),

  // §2.4 — kills the numeric DM id scheme; pair canonically ordered
  dmConversations: defineTable({
    /** Lexicographically smaller user id of the pair. */
    userLowId: v.id('users'),
    userHighId: v.id('users'),
    createdAt: v.number(),
    /** Mock numeric DM id as a string — transitional bridge (see topics). */
    seedKey: v.optional(v.string()),
  })
    .index('by_pair', ['userLowId', 'userHighId'])
    .index('by_low', ['userLowId'])
    .index('by_high', ['userHighId']),

  // §2.5 — ONE table, polymorphic parent {parentKind, parentId} (§3).
  // parentId is the parent's _id as a string: a union of three Id types
  // can't share one index; the kind+id pair restores safety in code.
  messages: defineTable({
    parentKind,
    parentId: v.string(),
    authorId: v.id('users'),
    body: v.string(),
    createdAt: v.number(),
    urgent: v.optional(v.boolean()),
    highlightType: v.optional(highlightType),
    resolved: v.optional(v.boolean()),
    resolvedById: v.optional(v.id('users')),
    resolutionMessage: v.optional(v.string()),
    /** Set when resolution came from a `→ msg` reply — drives inline editing. */
    resolvedByReplyId: v.optional(v.id('replies')),
    resolvedAt: v.optional(v.number()),
    /** Figma frame ids (static integration mocks, §6). Real uploads: Phase 5. */
    attachments: v.optional(v.array(v.string())),
    /** Mock message id ('t1_c1', 'dm1_c3', …) — transitional bridge. */
    seedKey: v.optional(v.string()),
  }).index('by_parent', ['parentKind', 'parentId']),

  // §2.6 — replyCount is DERIVED (§4.2); isNew is DERIVED via readState (§4.3)
  replies: defineTable({
    messageId: v.id('messages'),
    authorId: v.id('users'),
    body: v.string(),
    createdAt: v.number(),
    urgent: v.optional(v.boolean()),
    highlightType: v.optional(highlightType),
    attachments: v.optional(v.array(v.string())),
  }).index('by_message', ['messageId']),

  // §2.7 — per-user rows; counts + "yours" aggregate in the query (§4.6)
  reactions: defineTable({
    messageId: v.id('messages'),
    userId: v.id('users'),
    emoji: v.string(),
    createdAt: v.number(),
  })
    .index('by_message', ['messageId'])
    .index('by_message_user', ['messageId', 'userId']),

  // §2.8 — lastActivity/card preview DERIVED (§4.5); promotion never copies
  // messages (§3 edge case 1)
  huddles: defineTable({
    topicId: v.id('topics'),
    state: v.union(v.literal('active'), v.literal('resolved')),
    createdById: v.id('users'),
    createdAt: v.number(),
    originDmId: v.optional(v.id('dmConversations')),
    promotedAt: v.optional(v.number()),
    seedMessageId: v.optional(v.id('messages')),
    /** Mock huddle id ('h1_1', …) — transitional bridge. */
    seedKey: v.optional(v.string()),
  })
    .index('by_topic', ['topicId'])
    .index('by_originDm', ['originDmId']),

  // §2.9
  huddleMembers: defineTable({
    huddleId: v.id('huddles'),
    userId: v.id('users'),
  })
    .index('by_huddle', ['huddleId'])
    .index('by_user', ['userId']),

  // §2.10 — ONE watermark per container (user decision: unread = the tail);
  // containerId is a topic/dmConversation/huddle _id as a string
  readState: defineTable({
    userId: v.id('users'),
    containerId: v.string(),
    lastReadAt: v.number(),
  }).index('by_user_container', ['userId', 'containerId']),

  // §2.11 — titles/avatars/status/unread derived from the target
  stars: defineTable({
    userId: v.id('users'),
    kind: containerKind,
    targetId: v.string(),
    createdAt: v.number(),
  }).index('by_user', ['userId']),

  // §2.12 — the incoming-message inbox (urgent diverts to Desk Urgent).
  // Lifecycle: Add-to-Open-work (delete + deskOpenWork row) / Later
  // (snoozedUntil) / Dismiss (delete).
  screenerItems: defineTable({
    userId: v.id('users'),
    kind: containerKind,
    targetId: v.string(),
    preview: v.string(),
    snoozedUntil: v.optional(v.number()),
    createdAt: v.number(),
  }).index('by_user', ['userId']),

  // §2.13 — manually curated, kept until closed (closing deletes the row)
  deskOpenWork: defineTable({
    userId: v.id('users'),
    kind: containerKind,
    targetId: v.string(),
    addedAt: v.number(),
  }).index('by_user', ['userId']),
})
