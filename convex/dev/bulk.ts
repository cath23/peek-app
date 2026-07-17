/**
 * Dev-only fixture: bulk-insert plain messages into a topic to exercise the
 * "Show earlier messages" pagination (Phase 5). Never shipped to users —
 * production launches with an empty database (decision 2026-07-08); run via
 * `npx convex run dev/bulk:bulkMessages '{"topicKey":"1","count":120}'`.
 */
import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'

export const bulkMessages = internalMutation({
  args: { topicKey: v.string(), count: v.number() },
  handler: async (ctx, { topicKey, count }) => {
    const topics = await ctx.db.query('topics').collect()
    const topic =
      topics.find((t) => t.seedKey === topicKey) ??
      (ctx.db.normalizeId('topics', topicKey) ? await ctx.db.get(ctx.db.normalizeId('topics', topicKey)!) : null)
    if (!topic) throw new Error(`Unknown topic '${topicKey}'`)
    const users = await ctx.db.query('users').collect()
    const author = users.find((u) => u.seedKey && u.seedKey !== 'you') ?? users[0]
    if (!author) throw new Error('No users to author bulk messages')
    // Spread over the ~30 days before now, one per minute, oldest first.
    const base = Date.now() - 30 * 24 * 60 * 60 * 1000
    for (let i = 0; i < count; i++) {
      await ctx.db.insert('messages', {
        parentKind: 'topic',
        parentId: topic._id as string,
        authorId: author._id,
        body: `BULK-${String(i).padStart(3, '0')}`,
        createdAt: base + i * 60_000,
        seedKey: `bulk_${topicKey}_${i}`,
      })
    }
    return { inserted: count }
  },
})
