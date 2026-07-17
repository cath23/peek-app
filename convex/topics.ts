/**
 * Topic reads + creation (domain model §2.2–2.3).
 *
 * `id` is the stable seedKey where present (see convex/schema.ts).
 * `memberNames` are real names with `memberIds` index-aligned - the client
 * seam renders the viewer as 'You'. isResolved is DERIVED (§4.1), never
 * stored — computed in `list` from the topic's messages.
 */
import { v } from 'convex/values'
import { mutation, query, type MutationCtx } from './_generated/server'
import { viewerOrThrow } from './users'
import type { Doc, Id } from './_generated/dataModel'

/** Posting into (or joining) a topic makes you a member — one row, no dupes.
 *  Keeps topicMembers consistent for every user (QA #2.6). */
export async function ensureTopicMember(
  ctx: MutationCtx,
  topicId: Id<'topics'>,
  userId: Id<'users'>,
) {
  const rows = await ctx.db
    .query('topicMembers')
    .withIndex('by_topic', (q) => q.eq('topicId', topicId))
    .collect()
  if (!rows.some((r) => r.userId === userId)) {
    await ctx.db.insert('topicMembers', { topicId, userId, addedAt: Date.now() })
  }
}

/** Resolve a topic by stable client key (seedKey) or _id. */
async function findTopicByKey(ctx: MutationCtx, key: string): Promise<Doc<'topics'> | null> {
  const normalized = ctx.db.normalizeId('topics', key)
  if (normalized) {
    const doc = await ctx.db.get(normalized)
    if (doc) return doc
  }
  const rows = await ctx.db.query('topics').collect()
  return rows.find((t) => t.seedKey === key) ?? null
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const topics = await ctx.db.query('topics').collect()
    const out = []
    for (const t of topics) {
      const members = await ctx.db
        .query('topicMembers')
        .withIndex('by_topic', (q) => q.eq('topicId', t._id))
        .collect()
      const memberNames: string[] = []
      const memberIds: string[] = []
      for (const m of members) {
        const u = await ctx.db.get(m.userId)
        if (u) {
          memberNames.push(u.name)
          memberIds.push(u._id as string)
        }
      }
      // §4.1 — a topic is resolved when it has ≥1 message and every one is
      // resolved. Derived here, never stored.
      const msgs = await ctx.db
        .query('messages')
        .withIndex('by_parent', (q) => q.eq('parentKind', 'topic').eq('parentId', t._id as string))
        .collect()
      const isResolved = msgs.length > 0 && msgs.every((m) => m.resolved === true)
      out.push({
        id: t.seedKey ?? (t._id as string),
        title: t.title,
        createdAt: t.createdAt,
        memberNames,
        memberIds,
        isResolved,
      })
    }
    return out.sort((a, b) => a.createdAt - b.createdAt)
  },
})

export const create = mutation({
  args: {
    title: v.string(),
    /** Client-generated id (t_<ts>_<seq>) so the optimistic local topic
     *  and this record are the same topic. */
    seedKey: v.string(),
    inviteeNames: v.array(v.string()),
  },
  handler: async (ctx, { title, seedKey, inviteeNames }) => {
    const you = await viewerOrThrow(ctx)
    const now = Date.now()
    const topicId = await ctx.db.insert('topics', {
      title,
      creatorId: you._id,
      createdAt: now,
      seedKey,
    })
    await ctx.db.insert('topicMembers', { topicId, userId: you._id, addedAt: now })
    for (const name of inviteeNames) {
      if (name === 'You') continue
      const user = (await ctx.db.query('users').collect()).find((u) => u.name === name)
      if (user && user._id !== you._id) {
        await ctx.db.insert('topicMembers', { topicId, userId: user._id, addedAt: now })
      }
    }
    return topicId
  },
})

/** Join a topic you're not a member of (the topic-list Join banner, §QA #2.7). */
export const join = mutation({
  args: { topicKey: v.string() },
  handler: async (ctx, { topicKey }) => {
    const you = await viewerOrThrow(ctx)
    const topic = await findTopicByKey(ctx, topicKey)
    if (!topic) throw new Error(`Unknown topic '${topicKey}'`)
    await ensureTopicMember(ctx, topic._id, you._id)
  },
})
