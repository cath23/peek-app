/**
 * Message reads + writes (domain model §2.5, §3 — one polymorphic table).
 *
 * Phase 2 transitional shape: ids are seedKeys where present so the client
 * keeps joining mock-keyed replies/reactions until those entities swap;
 * author names are resolved server-side with the 'You' convention
 * (hardcoded seed identity until Phase 3 auth).
 */
import { v } from 'convex/values'
import { mutation, query, type QueryCtx, type MutationCtx } from './_generated/server'
import { highlightType } from './schema'
import type { Doc, Id } from './_generated/dataModel'

const parentKindArg = v.union(v.literal('topic'), v.literal('dm'))

async function resolveParentId(
  ctx: QueryCtx | MutationCtx,
  kind: 'topic' | 'dm',
  key: string,
): Promise<string | null> {
  if (kind === 'topic') {
    const topics = await ctx.db.query('topics').collect()
    const t = topics.find((t) => t.seedKey === key || (t._id as string) === key)
    return t ? (t._id as string) : null
  }
  const dms = await ctx.db.query('dmConversations').collect()
  const d = dms.find((d) => d.seedKey === key || (d._id as string) === key)
  return d ? (d._id as string) : null
}

async function userNames(ctx: QueryCtx | MutationCtx): Promise<Map<Id<'users'>, string>> {
  const users = await ctx.db.query('users').collect()
  return new Map(users.map((u) => [u._id, u.seedKey === 'you' ? 'You' : u.name]))
}

function shape(m: Doc<'messages'>, names: Map<Id<'users'>, string>) {
  return {
    id: m.seedKey ?? (m._id as string),
    authorName: names.get(m.authorId) ?? 'Unknown',
    createdAt: m.createdAt,
    body: m.body,
    isUrgent: m.urgent,
    highlightType: m.highlightType,
    isResolved: m.resolved,
    resolvedBy: m.resolvedById ? names.get(m.resolvedById) : undefined,
    resolutionMessage: m.resolutionMessage,
    attachments: m.attachments,
  }
}

/** All messages of a topic or DM, oldest first. `parentKey` is a seedKey or _id. */
export const list = query({
  args: { parentKind: parentKindArg, parentKey: v.string() },
  handler: async (ctx, { parentKind, parentKey }) => {
    const parentId = await resolveParentId(ctx, parentKind, parentKey)
    if (!parentId) return []
    const rows = await ctx.db
      .query('messages')
      .withIndex('by_parent', (q) => q.eq('parentKind', parentKind).eq('parentId', parentId))
      .collect()
    const names = await userNames(ctx)
    const shaped = []
    for (const m of rows.sort((a, b) => a.createdAt - b.createdAt)) {
      const replies = await ctx.db
        .query('replies')
        .withIndex('by_message', (q) => q.eq('messageId', m._id))
        .collect()
      shaped.push({ ...shape(m, names), replyCount: replies.length })
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
    return shape(m, await userNames(ctx))
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
    /** First message to a person with no conversation yet: the DM record is
     *  created on demand for this partner (name lookup — Phase 3 makes it an id). */
    dmPartnerName: v.optional(v.string()),
  },
  handler: async (ctx, { parentKind, parentKey, seedKey, body, highlightType, resolved, resolutionMessage, attachments, dmPartnerName }) => {
    const you = await ctx.db
      .query('users')
      .withIndex('by_seedKey', (q) => q.eq('seedKey', 'you'))
      .unique()
    if (!you) throw new Error("Seed user missing — run dev/seedDemo:seed first (Phase 2 uses the hardcoded 'you' identity)")
    let parentId = await resolveParentId(ctx, parentKind, parentKey)
    if (!parentId && parentKind === 'dm' && dmPartnerName) {
      const partner = (await ctx.db.query('users').collect()).find((u) => u.name === dmPartnerName)
      if (partner) {
        const [userLowId, userHighId] =
          (you._id as string) < (partner._id as string) ? [you._id, partner._id] : [partner._id, you._id]
        parentId = await ctx.db.insert('dmConversations', {
          userLowId,
          userHighId,
          createdAt: Date.now(),
          seedKey: parentKey,
        })
      }
    }
    if (!parentId) throw new Error(`Unknown ${parentKind} '${parentKey}'`)
    return ctx.db.insert('messages', {
      parentKind,
      parentId,
      authorId: you._id,
      body,
      createdAt: Date.now(),
      highlightType,
      resolved,
      resolvedById: resolved ? you._id : undefined,
      resolutionMessage,
      attachments,
      seedKey,
    })
  },
})

async function findByKey(ctx: MutationCtx, key: string): Promise<Doc<'messages'> | null> {
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
    const m = await findByKey(ctx, key)
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

export const remove = mutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const m = await findByKey(ctx, key)
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
