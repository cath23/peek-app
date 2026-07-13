/**
 * Sidebar unread dots (§4.3), derived per viewer.
 *
 * Same rule the mock fixture used, now computed from readState: a container
 * is unread when any NON-urgent message in it is new to you, or has a reply
 * that is new to you. Urgent items deliberately don't raise the accent dot —
 * they surface in the Desk *Urgent* section instead.
 */
import { query } from './_generated/server'
import { watermarks } from './readState'
import { viewerId } from './users'
import type { Doc, Id } from './_generated/dataModel'

async function containerHasUnread(
  ctx: Parameters<typeof watermarks>[0],
  me: Id<'users'>,
  wm: Map<string, number>,
  kind: 'topic' | 'dm',
  containerId: string,
): Promise<boolean> {
  const msgs = await ctx.db
    .query('messages')
    .withIndex('by_parent', (q) => q.eq('parentKind', kind).eq('parentId', containerId))
    .collect()
  const containerWm = wm.get(containerId)
  const isNew = (at: number, mark: number | undefined) => mark === undefined || at > mark
  for (const m of msgs) {
    if (m.urgent) continue // urgent → Desk Urgent, not the unread dot
    if (m.authorId !== me && isNew(m.createdAt, containerWm)) return true
    const replies = await ctx.db
      .query('replies')
      .withIndex('by_message', (q) => q.eq('messageId', m._id))
      .collect()
    const threadWm = wm.get(m._id as string)
    if (replies.some((r) => r.authorId !== me && isNew(r.createdAt, threadWm))) return true
  }
  return false
}

/** Which topics / DMs currently show an unread dot. Keys are the client's ids. */
export const summary = query({
  args: {},
  handler: async (ctx) => {
    const me = await viewerId(ctx)
    if (!me) return { topics: [] as string[], dms: [] as string[] }
    const wm = await watermarks(ctx, me)

    const topics: string[] = []
    for (const t of await ctx.db.query('topics').collect()) {
      if (await containerHasUnread(ctx, me, wm, 'topic', t._id as string)) {
        topics.push(t.seedKey ?? (t._id as string))
      }
    }

    const dms: string[] = []
    for (const dm of await ctx.db.query('dmConversations').collect()) {
      if (dm.userLowId !== me && dm.userHighId !== me) continue
      if (!(await containerHasUnread(ctx, me, wm, 'dm', dm._id as string))) continue
      const partnerId = dm.userLowId === me ? dm.userHighId : dm.userLowId
      const partner: Doc<'users'> | null = await ctx.db.get(partnerId)
      if (partner) dms.push(partner.seedKey ?? (partnerId as string))
    }

    return { topics, dms }
  },
})
