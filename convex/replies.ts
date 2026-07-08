/**
 * Reply reads + writes (domain model §2.6).
 *
 * Shape mirrors convex/messages.ts: ids are stable seedKeys where present
 * (see convex/schema.ts), author names resolved server-side with the 'You'
 * convention (hardcoded seed identity until Phase 3 auth).
 */
import { v } from 'convex/values'
import { mutation, query, type QueryCtx, type MutationCtx } from './_generated/server'
import { highlightType } from './schema'
import type { Doc, Id } from './_generated/dataModel'

async function findMessageByKey(ctx: QueryCtx | MutationCtx, key: string): Promise<Doc<'messages'> | null> {
  const bySeed = await ctx.db
    .query('messages')
    .withIndex('by_seedKey', (q) => q.eq('seedKey', key))
    .unique()
  if (bySeed) return bySeed
  const normalized = ctx.db.normalizeId('messages', key)
  return normalized ? await ctx.db.get(normalized) : null
}

async function userNames(ctx: QueryCtx | MutationCtx): Promise<Map<Id<'users'>, string>> {
  const users = await ctx.db.query('users').collect()
  return new Map(users.map((u) => [u._id, u.seedKey === 'you' ? 'You' : u.name]))
}

/** All replies of a message, oldest first. `messageKey` is a seedKey or _id. */
export const list = query({
  args: { messageKey: v.string() },
  handler: async (ctx, { messageKey }) => {
    const message = await findMessageByKey(ctx, messageKey)
    if (!message) return []
    const rows = await ctx.db
      .query('replies')
      .withIndex('by_message', (q) => q.eq('messageId', message._id))
      .collect()
    const names = await userNames(ctx)
    return rows
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((r) => ({
        id: r.seedKey ?? (r._id as string),
        authorName: names.get(r.authorId) ?? 'Unknown',
        createdAt: r.createdAt,
        body: r.body,
        isUrgent: r.urgent,
        highlightType: r.highlightType,
        attachments: r.attachments,
      }))
  },
})

export const send = mutation({
  args: {
    messageKey: v.string(),
    /** Client-generated id — the optimistic local copy and this record are the same reply. */
    seedKey: v.string(),
    body: v.string(),
    highlightType: v.optional(highlightType),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { messageKey, seedKey, body, highlightType, attachments }) => {
    const message = await findMessageByKey(ctx, messageKey)
    if (!message) throw new Error(`Unknown message '${messageKey}'`)
    const you = await ctx.db
      .query('users')
      .withIndex('by_seedKey', (q) => q.eq('seedKey', 'you'))
      .unique()
    if (!you) throw new Error("Seed user missing — run dev/seedDemo:seed first (Phase 2 uses the hardcoded 'you' identity)")
    return ctx.db.insert('replies', {
      messageId: message._id,
      authorId: you._id,
      body,
      createdAt: Date.now(),
      highlightType,
      attachments,
      seedKey,
    })
  },
})

export const remove = mutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const bySeed = await ctx.db
      .query('replies')
      .withIndex('by_seedKey', (q) => q.eq('seedKey', key))
      .unique()
    const normalized = bySeed ? null : ctx.db.normalizeId('replies', key)
    const r = bySeed ?? (normalized ? await ctx.db.get(normalized) : null)
    if (r) await ctx.db.delete(r._id)
  },
})
