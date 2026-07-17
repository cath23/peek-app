/**
 * Message reads + writes (domain model §2.5, §3 — one polymorphic table).
 *
 * Ids returned to the client are stable seedKeys where present (demo-seed
 * ids + client-generated optimistic ids — see convex/schema.ts). Rows carry
 * real author names plus authorId; the client seam renders the viewer's own
 * rows as 'You' by id comparison (Phase 3 identity sweep). The viewer comes
 * from ctx.auth (convex/users.ts).
 */
import { v } from 'convex/values'
import { mutation, query, type QueryCtx, type MutationCtx } from './_generated/server'
import { highlightType } from './schema'
import { viewerId, viewerOrThrow } from './users'
import { watermarks } from './readState'
import { isUrgentBody, screenMessage } from './screener'
import { ensureTopicMember } from './topics'
import type { Doc, Id } from './_generated/dataModel'

const parentKindArg = v.union(v.literal('topic'), v.literal('dm'), v.literal('huddle'))

/** Resolve a person key (seedKey like 'alice', or a users _id) to the user. */
export async function resolveUserKey(
  ctx: QueryCtx | MutationCtx,
  key: string,
): Promise<Doc<'users'> | null> {
  const bySeed = await ctx.db
    .query('users')
    .withIndex('by_seedKey', (q) => q.eq('seedKey', key))
    .unique()
  if (bySeed) return bySeed
  const normalized = ctx.db.normalizeId('users', key)
  return normalized ? await ctx.db.get(normalized) : null
}

/**
 * The one canonical DM conversation for a pair of users (§2.4).
 *
 * DMs are addressed by the PARTNER's person key, never by a client-minted
 * conversation id: the pair is ordered canonically and looked up on
 * `by_pair`, so both people always land on the same row and no client can
 * name a conversation it isn't part of.
 */
export async function findDmForPair(
  ctx: QueryCtx | MutationCtx,
  aId: Id<'users'>,
  bId: Id<'users'>,
) {
  const [userLowId, userHighId] = (aId as string) < (bId as string) ? [aId, bId] : [bId, aId]
  return ctx.db
    .query('dmConversations')
    .withIndex('by_pair', (q) => q.eq('userLowId', userLowId).eq('userHighId', userHighId))
    .unique()
}

/** `key` is a topic/huddle seedKey-or-_id, or — for DMs — the partner's person key. */
export async function resolveParentId(
  ctx: QueryCtx | MutationCtx,
  kind: 'topic' | 'dm' | 'huddle',
  key: string,
  viewer: Id<'users'> | null,
): Promise<string | null> {
  if (kind === 'dm') {
    if (!viewer) return null
    const partner = await resolveUserKey(ctx, key)
    if (!partner) return null
    const dm = await findDmForPair(ctx, viewer, partner._id)
    return dm ? (dm._id as string) : null
  }
  const table = kind === 'topic' ? 'topics' : 'huddles'
  const rows = await ctx.db.query(table).collect()
  const hit = rows.find((r) => r.seedKey === key || (r._id as string) === key)
  return hit ? (hit._id as string) : null
}

export async function userNames(ctx: QueryCtx | MutationCtx): Promise<Map<Id<'users'>, string>> {
  const users = await ctx.db.query('users').collect()
  return new Map(users.map((u) => [u._id, u.name]))
}

/** Per-user rows → the aggregate array the cards render (§4.6): first-seen
 *  emoji order, count, owner 'yours' when the current user is among them. */
export async function aggregateReactions(
  ctx: QueryCtx | MutationCtx,
  messageId: Id<'messages'>,
  youId: Id<'users'> | undefined,
): Promise<{ emoji: string; count: number; owner: 'yours' | 'others' }[] | undefined> {
  const rows = await ctx.db
    .query('reactions')
    .withIndex('by_message', (q) => q.eq('messageId', messageId))
    .collect()
  if (rows.length === 0) return undefined
  rows.sort((a, b) => a._creationTime - b._creationTime)
  const agg: { emoji: string; count: number; owner: 'yours' | 'others' }[] = []
  for (const r of rows) {
    const entry = agg.find((e) => e.emoji === r.emoji)
    if (entry) {
      entry.count++
      if (r.userId === youId) entry.owner = 'yours'
    } else {
      agg.push({ emoji: r.emoji, count: 1, owner: r.userId === youId ? 'yours' : 'others' })
    }
  }
  return agg
}

/**
 * The two unread signals (§4.3), derived per viewer:
 *   hasNewMessage — the message itself is newer than your CONTAINER watermark
 *   hasNewReply   — it has a reply newer than your THREAD watermark for it
 * Your own writing is never unread. No watermark = never opened = all new.
 */
export async function unreadFlags(
  ctx: QueryCtx | MutationCtx,
  m: Doc<'messages'>,
  me: Id<'users'> | null,
  wm: Map<string, number>,
  replies: Doc<'replies'>[],
): Promise<{ hasNewMessage?: boolean; hasNewReply?: boolean }> {
  if (!me) return {}
  const containerWm = wm.get(m.parentId)
  const threadWm = wm.get(m._id as string)
  const isNew = (at: number, mark: number | undefined) => mark === undefined || at > mark
  const hasNewMessage = m.authorId !== me && isNew(m.createdAt, containerWm)
  const hasNewReply = replies.some((r) => r.authorId !== me && isNew(r.createdAt, threadWm))
  return {
    hasNewMessage: hasNewMessage || undefined,
    hasNewReply: hasNewReply || undefined,
  }
}

export async function shape(ctx: QueryCtx | MutationCtx, m: Doc<'messages'>, names: Map<Id<'users'>, string>) {
  const resolvedByReply = m.resolvedByReplyId ? await ctx.db.get(m.resolvedByReplyId) : null
  return {
    id: m.seedKey ?? (m._id as string),
    authorId: m.authorId as string,
    authorName: names.get(m.authorId) ?? 'Unknown',
    createdAt: m.createdAt,
    body: m.body,
    isUrgent: m.urgent,
    highlightType: m.highlightType,
    isResolved: m.resolved,
    resolvedBy: m.resolvedById ? names.get(m.resolvedById) : undefined,
    resolvedById: m.resolvedById ? (m.resolvedById as string) : undefined,
    resolutionMessage: m.resolutionMessage,
    resolvedByReplyId: resolvedByReply ? resolvedByReply.seedKey ?? (resolvedByReply._id as string) : undefined,
    attachments: m.attachments,
  }
}

/** All messages of a topic or DM, oldest first. `parentKey` is a seedKey or _id. */
export const list = query({
  args: { parentKind: parentKindArg, parentKey: v.string() },
  handler: async (ctx, { parentKind, parentKey }) => {
    const me = await viewerId(ctx)
    const parentId = await resolveParentId(ctx, parentKind, parentKey, me)
    if (!parentId) return []
    const rows = await ctx.db
      .query('messages')
      .withIndex('by_parent', (q) => q.eq('parentKind', parentKind).eq('parentId', parentId))
      .collect()
    const names = await userNames(ctx)
    const wm = me ? await watermarks(ctx, me) : new Map<string, number>()
    const shaped = []
    for (const m of rows.sort((a, b) => a.createdAt - b.createdAt)) {
      const replies = await ctx.db
        .query('replies')
        .withIndex('by_message', (q) => q.eq('messageId', m._id))
        .collect()
      shaped.push({
        ...(await shape(ctx, m, names)),
        replyCount: replies.length,
        reactions: await aggregateReactions(ctx, m._id, me ?? undefined),
        ...(await unreadFlags(ctx, m, me, wm, replies)),
      })
    }
    return shaped
  },
})

/** Single-message lookup by seedKey/_id — the thread panel's refresh fallback. */
export const get = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    let m = await ctx.db
      .query('messages')
      .withIndex('by_seedKey', (q) => q.eq('seedKey', key))
      .unique()
    if (!m) {
      const normalized = ctx.db.normalizeId('messages', key)
      m = normalized ? await ctx.db.get(normalized) : null
    }
    if (!m) return null
    const me = await viewerId(ctx)
    return {
      ...(await shape(ctx, m, await userNames(ctx))),
      reactions: await aggregateReactions(ctx, m._id, me ?? undefined),
    }
  },
})

/** Add or remove the current user's reaction (per-user rows, §2.7). */
export const toggleReaction = mutation({
  args: { key: v.string(), emoji: v.string() },
  handler: async (ctx, { key, emoji }) => {
    const m = await findMessageByKey(ctx, key)
    if (!m) return // reply reactions stay session-local until modeled (§2.7 is message-keyed)
    const you = await viewerOrThrow(ctx)
    const mine = await ctx.db
      .query('reactions')
      .withIndex('by_message_user', (q) => q.eq('messageId', m._id).eq('userId', you._id))
      .collect()
    const existing = mine.find((r) => r.emoji === emoji)
    if (existing) {
      await ctx.db.delete(existing._id)
    } else {
      await ctx.db.insert('reactions', {
        messageId: m._id,
        userId: you._id,
        emoji,
        createdAt: Date.now(),
      })
    }
  },
})

export const send = mutation({
  args: {
    parentKind: parentKindArg,
    parentKey: v.string(),
    /** Client-generated id — the optimistic local copy and this record are the same message. */
    seedKey: v.string(),
    body: v.string(),
    highlightType: v.optional(highlightType),
    resolved: v.optional(v.boolean()),
    resolutionMessage: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { parentKind, parentKey, seedKey, body, highlightType, resolved, resolutionMessage, attachments }) => {
    const you = await viewerOrThrow(ctx)
    let parentId = await resolveParentId(ctx, parentKind, parentKey, you._id)
    // First DM to someone: create the pair's conversation on demand.
    if (!parentId && parentKind === 'dm') {
      const partner = await resolveUserKey(ctx, parentKey)
      if (partner && partner._id !== you._id) {
        const [userLowId, userHighId] =
          (you._id as string) < (partner._id as string) ? [you._id, partner._id] : [partner._id, you._id]
        parentId = await ctx.db.insert('dmConversations', {
          userLowId,
          userHighId,
          createdAt: Date.now(),
        })
      }
    }
    if (!parentId) throw new Error(`Unknown ${parentKind} '${parentKey}'`)
    // `!@Name` is the composer's urgent marker — urgent diverts to Desk
    // Urgent and never screens (§2.12).
    const urgent = isUrgentBody(body) || undefined
    const id = await ctx.db.insert('messages', {
      parentKind,
      parentId,
      authorId: you._id,
      body,
      createdAt: Date.now(),
      urgent,
      highlightType,
      resolved,
      resolvedById: resolved ? you._id : undefined,
      resolutionMessage,
      attachments,
      seedKey,
    })
    // Posting into a topic makes you a member (QA #2.6 — keeps the member
    // pill consistent for every user; also the implicit join for QA #2.7).
    if (parentKind === 'topic') {
      const topicId = ctx.db.normalizeId('topics', parentId)
      if (topicId) await ensureTopicMember(ctx, topicId, you._id)
    }
    const inserted = await ctx.db.get(id)
    if (inserted) await screenMessage(ctx, inserted)
    return id
  },
})

export async function findMessageByKey(
  ctx: QueryCtx | MutationCtx,
  key: string,
): Promise<Doc<'messages'> | null> {
  const bySeed = await ctx.db
    .query('messages')
    .withIndex('by_seedKey', (q) => q.eq('seedKey', key))
    .unique()
  if (bySeed) return bySeed
  const normalized = ctx.db.normalizeId('messages', key)
  return normalized ? await ctx.db.get(normalized) : null
}

export const editBody = mutation({
  args: { key: v.string(), body: v.string() },
  handler: async (ctx, { key, body }) => {
    const m = await findMessageByKey(ctx, key)
    if (m) {
      await ctx.db.patch(m._id, { body })
      return
    }
    // The seam's editBody is id-keyed across messages AND replies.
    const bySeed = await ctx.db
      .query('replies')
      .withIndex('by_seedKey', (q) => q.eq('seedKey', key))
      .unique()
    const normalized = bySeed ? null : ctx.db.normalizeId('replies', key)
    const r = bySeed ?? (normalized ? await ctx.db.get(normalized) : null)
    if (r) await ctx.db.patch(r._id, { body })
  },
})

export const setResolution = mutation({
  args: {
    key: v.string(),
    resolved: v.boolean(),
    resolutionMessage: v.optional(v.string()),
    /** Reply (seedKey/_id) whose `→ msg` resolution resolved the parent. */
    resolvedByReplyKey: v.optional(v.string()),
    /** Card-level resolve drops an earlier reply pointer; thread-level keeps it. */
    dropReplyPointer: v.optional(v.boolean()),
  },
  handler: async (ctx, { key, resolved, resolutionMessage, resolvedByReplyKey, dropReplyPointer }) => {
    const m = await findMessageByKey(ctx, key)
    if (!m) return
    if (!resolved) {
      await ctx.db.patch(m._id, {
        resolved: undefined,
        resolvedById: undefined,
        resolutionMessage: undefined,
        resolvedByReplyId: undefined,
        resolvedAt: undefined,
      })
      return
    }
    const you = await viewerOrThrow(ctx)
    let resolvedByReplyId: Id<'replies'> | undefined
    if (resolvedByReplyKey) {
      const bySeed = await ctx.db
        .query('replies')
        .withIndex('by_seedKey', (q) => q.eq('seedKey', resolvedByReplyKey))
        .unique()
      resolvedByReplyId = bySeed?._id ?? ctx.db.normalizeId('replies', resolvedByReplyKey) ?? undefined
    } else if (!dropReplyPointer) {
      resolvedByReplyId = m.resolvedByReplyId
    }
    await ctx.db.patch(m._id, {
      resolved: true,
      resolvedById: you._id,
      resolutionMessage,
      resolvedByReplyId,
      resolvedAt: Date.now(),
    })
  },
})

export const setHighlight = mutation({
  args: { key: v.string(), highlightType: v.optional(highlightType) },
  handler: async (ctx, { key, highlightType: hl }) => {
    const m = await findMessageByKey(ctx, key)
    if (m) {
      await ctx.db.patch(m._id, { highlightType: hl })
      return
    }
    // Highlights are id-keyed across messages AND replies (like editBody).
    const bySeed = await ctx.db
      .query('replies')
      .withIndex('by_seedKey', (q) => q.eq('seedKey', key))
      .unique()
    const normalized = bySeed ? null : ctx.db.normalizeId('replies', key)
    const r = bySeed ?? (normalized ? await ctx.db.get(normalized) : null)
    if (r) await ctx.db.patch(r._id, { highlightType: hl })
  },
})

export const remove = mutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const m = await findMessageByKey(ctx, key)
    if (!m) return
    const replies = await ctx.db
      .query('replies')
      .withIndex('by_message', (q) => q.eq('messageId', m._id))
      .collect()
    for (const r of replies) await ctx.db.delete(r._id)
    const reactions = await ctx.db
      .query('reactions')
      .withIndex('by_message', (q) => q.eq('messageId', m._id))
      .collect()
    for (const r of reactions) await ctx.db.delete(r._id)
    await ctx.db.delete(m._id)
  },
})
