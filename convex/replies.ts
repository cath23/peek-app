/**
 * Reply reads + writes (domain model §2.6).
 *
 * Shape mirrors convex/messages.ts: ids are stable seedKeys where present
 * (see convex/schema.ts); rows carry real author names plus authorId - the
 * client seam renders the viewer's own rows as 'You' (Phase 3).
 */
import { v } from 'convex/values'
import { mutation, query, type QueryCtx, type MutationCtx } from './_generated/server'
import { highlightType } from './schema'
import { viewerId, viewerOrThrow } from './users'
import { watermarks } from './readState'
import { isUrgentBody, screenReply } from './screener'
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
  return new Map(users.map((u) => [u._id, u.name]))
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
    // isNew is derived from YOUR thread watermark for this message (§4.3) —
    // set when you open its thread panel, not when you open the container.
    const me = await viewerId(ctx)
    const threadWm = me ? (await watermarks(ctx, me)).get(message._id as string) : undefined
    return rows
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((r) => ({
        id: r.seedKey ?? (r._id as string),
        authorId: r.authorId as string,
        authorName: names.get(r.authorId) ?? 'Unknown',
        createdAt: r.createdAt,
        body: r.body,
        isUrgent: r.urgent,
        highlightType: r.highlightType,
        attachments: r.attachments,
        isNew:
          me && r.authorId !== me && (threadWm === undefined || r.createdAt > threadWm)
            ? true
            : undefined,
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
    const you = await viewerOrThrow(ctx)
    const id = await ctx.db.insert('replies', {
      messageId: message._id,
      authorId: you._id,
      body,
      createdAt: Date.now(),
      urgent: isUrgentBody(body) || undefined,
      highlightType,
      attachments,
      seedKey,
    })
    const inserted = await ctx.db.get(id)
    if (inserted) await screenReply(ctx, inserted)
    return id
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
