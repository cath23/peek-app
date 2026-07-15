/**
 * Read state (§2.10, §4.3) — what you've already seen.
 *
 * TWO granularities, per the 2026-07-09 ruling (which revises the earlier
 * "one watermark per container"): the UI has two distinct unread signals and
 * they clear independently.
 *
 *   - **Container watermark** — a topic / DM / huddle. Set when you open the
 *     conversation (after a short dwell). Drives `hasNewMessage`.
 *   - **Thread watermark** — one message's reply thread. Set only when you
 *     open THAT message's thread panel. Drives `hasNewReply` / `isNew`.
 *
 * Opening a topic therefore does not clear a "1 new reply" badge — you have
 * to open the thread, exactly as the card designs imply.
 *
 * Both live in the one `readState` table: `containerId` is a container _id
 * or, for a thread, the parent message's _id. No watermark row = never
 * opened, so everything in it (except your own writing) is new.
 */
import { v } from 'convex/values'
import { mutation, type QueryCtx, type MutationCtx } from './_generated/server'
import { findMessageByKey, resolveParentId } from './messages'
import { viewerOrThrow } from './users'
import type { Id } from './_generated/dataModel'

const parentKindArg = v.union(v.literal('topic'), v.literal('dm'), v.literal('huddle'))

/** All of a user's watermarks, keyed by containerId (container _id or message _id). */
export async function watermarks(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
): Promise<Map<string, number>> {
  const rows = await ctx.db
    .query('readState')
    .withIndex('by_user_container', (q) => q.eq('userId', userId))
    .collect()
  return new Map(rows.map((r) => [r.containerId, r.lastReadAt]))
}

/** Watermarks only ever move forward. */
async function touch(ctx: MutationCtx, userId: Id<'users'>, containerId: string, at: number) {
  const existing = await ctx.db
    .query('readState')
    .withIndex('by_user_container', (q) => q.eq('userId', userId).eq('containerId', containerId))
    .unique()
  if (existing) {
    if (existing.lastReadAt < at) await ctx.db.patch(existing._id, { lastReadAt: at })
  } else {
    await ctx.db.insert('readState', { userId, containerId, lastReadAt: at })
  }
}

/**
 * Reading a conversation from anywhere retires its Screener item (§2.12,
 * ruling 2026-07-15): the Screener is for what you HAVEN'T looked at yet, so
 * opening the topic/DM from People or Topics removes it from the Screener.
 * `containerId` is the container's _id (the screener item's targetId).
 */
async function clearScreenerFor(ctx: MutationCtx, userId: Id<'users'>, containerId: string) {
  const rows = await ctx.db
    .query('screenerItems')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect()
  for (const r of rows) {
    if (r.targetId === containerId) await ctx.db.delete(r._id)
  }
}

/** You opened a topic / DM / huddle and stayed a moment: its messages are read. */
export const markContainerRead = mutation({
  args: { parentKind: parentKindArg, parentKey: v.string() },
  handler: async (ctx, { parentKind, parentKey }) => {
    const you = await viewerOrThrow(ctx)
    const parentId = await resolveParentId(ctx, parentKind, parentKey, you._id)
    if (!parentId) return
    await touch(ctx, you._id, parentId, Date.now())
    await clearScreenerFor(ctx, you._id, parentId)
  },
})

/** You opened one message's thread panel: its replies are read. */
export const markThreadRead = mutation({
  args: { messageKey: v.string() },
  handler: async (ctx, { messageKey }) => {
    const you = await viewerOrThrow(ctx)
    const m = await findMessageByKey(ctx, messageKey)
    if (!m) return
    await touch(ctx, you._id, m._id as string, Date.now())
    // Engaging with the thread also retires the container's Screener item.
    await clearScreenerFor(ctx, you._id, m.parentId)
  },
})
