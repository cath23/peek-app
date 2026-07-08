/**
 * Huddle reads + writes (domain model §2.8–2.9).
 *
 * One `list` query returns every huddle fully shaped (members, preview
 * conversation, extra messages, promotion metadata) — the client builds its
 * per-topic and per-origin-DM lookups from it (the dataset is small and the
 * sidebar needs all topics' huddles anyway). Id conventions as in the other
 * modules: stable seedKeys where present, 'You' convention for names.
 */
import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { aggregateReactions, shape, userNames, youUser } from './messages'
import type { Doc } from './_generated/dataModel'

export const list = query({
  args: {},
  handler: async (ctx) => {
    const huddles = await ctx.db.query('huddles').collect()
    const names = await userNames(ctx)
    const you = await youUser(ctx)
    const topics = await ctx.db.query('topics').collect()
    const topicKey = new Map(topics.map((t) => [t._id as string, t.seedKey ?? (t._id as string)]))
    const out = []
    for (const h of huddles) {
      const memberRows = await ctx.db
        .query('huddleMembers')
        .withIndex('by_huddle', (q) => q.eq('huddleId', h._id))
        .collect()
      memberRows.sort((a, b) => a._creationTime - b._creationTime)
      const members: string[] = []
      for (const m of memberRows) {
        const u = await ctx.db.get(m.userId)
        if (u) members.push(u.seedKey === 'you' ? 'You' : u.name)
      }

      const msgs = await ctx.db
        .query('messages')
        .withIndex('by_parent', (q) => q.eq('parentKind', 'huddle').eq('parentId', h._id as string))
        .collect()
      msgs.sort((a, b) => a.createdAt - b.createdAt)
      const shapeFull = async (m: Doc<'messages'>) => {
        const replies = await ctx.db
          .query('replies')
          .withIndex('by_message', (q) => q.eq('messageId', m._id))
          .collect()
        return {
          ...(await shape(ctx, m, names)),
          replyCount: replies.length,
          reactions: await aggregateReactions(ctx, m._id, you?._id),
        }
      }
      const shaped = []
      for (const m of msgs) shaped.push(await shapeFull(m))

      // Promoted huddles preview the DM message that seeded them; regular
      // huddles preview their first message (the rest are extraConvs).
      const seedMsg = h.seedMessageId ? await ctx.db.get(h.seedMessageId) : null
      const conversation = seedMsg ? await shapeFull(seedMsg) : shaped[0]
      const extraConvs = seedMsg ? shaped : shaped.slice(1)

      const originDm = h.originDmId ? await ctx.db.get(h.originDmId) : null
      const lastMs = Math.max(h.createdAt, ...msgs.map((m) => m.createdAt))
      out.push({
        id: h.seedKey ?? (h._id as string),
        topicId: topicKey.get(h.topicId as string) ?? (h.topicId as string),
        members,
        state: h.state,
        lastActivityMs: lastMs,
        conversation,
        extraConvs,
        originDmKey: originDm ? originDm.seedKey ?? (originDm._id as string) : undefined,
        promotedAtMs: h.promotedAt,
        seedMessageId: seedMsg ? seedMsg.seedKey ?? (seedMsg._id as string) : undefined,
      })
    }
    return out
  },
})

async function findHuddleByKey(ctx: Parameters<typeof userNames>[0], key: string) {
  const rows = await ctx.db.query('huddles').collect()
  return rows.find((h) => h.seedKey === key || (h._id as string) === key) ?? null
}

/** Inline/dialog creation. `firstMessage` is optional (V2 dialog = members only). */
export const create = mutation({
  args: {
    topicKey: v.string(),
    seedKey: v.string(),
    memberNames: v.array(v.string()),
    firstMessage: v.optional(v.object({ seedKey: v.string(), body: v.string() })),
  },
  handler: async (ctx, { topicKey, seedKey, memberNames, firstMessage }) => {
    const topics = await ctx.db.query('topics').collect()
    const topic = topics.find((t) => t.seedKey === topicKey || (t._id as string) === topicKey)
    if (!topic) throw new Error(`Unknown topic '${topicKey}'`)
    const you = await youUser(ctx)
    if (!you) throw new Error("Seed user missing — run dev/seedDemo:seed first (Phase 2 uses the hardcoded 'you' identity)")
    const now = Date.now()
    const huddleId = await ctx.db.insert('huddles', {
      topicId: topic._id,
      state: 'active',
      createdById: you._id,
      createdAt: now,
      seedKey,
    })
    const users = await ctx.db.query('users').collect()
    await ctx.db.insert('huddleMembers', { huddleId, userId: you._id })
    for (const name of memberNames) {
      if (name === 'You') continue
      const u = users.find((u) => u.name === name)
      if (u && u._id !== you._id) await ctx.db.insert('huddleMembers', { huddleId, userId: u._id })
    }
    if (firstMessage) {
      await ctx.db.insert('messages', {
        parentKind: 'huddle',
        parentId: huddleId as string,
        authorId: you._id,
        body: firstMessage.body,
        createdAt: now,
        seedKey: firstMessage.seedKey,
      })
    }
    return huddleId
  },
})

/** DM promotion: the huddle anchors to an existing DM message (never copies it — §3). */
export const createFromDm = mutation({
  args: {
    topicKey: v.string(),
    seedKey: v.string(),
    originDmKey: v.string(),
    seedMessageKey: v.string(),
    memberNames: v.array(v.string()),
  },
  handler: async (ctx, { topicKey, seedKey, originDmKey, seedMessageKey, memberNames }) => {
    const topics = await ctx.db.query('topics').collect()
    const topic = topics.find((t) => t.seedKey === topicKey || (t._id as string) === topicKey)
    if (!topic) throw new Error(`Unknown topic '${topicKey}'`)
    const dms = await ctx.db.query('dmConversations').collect()
    const dm = dms.find((d) => d.seedKey === originDmKey || (d._id as string) === originDmKey)
    const seedMsg = await ctx.db
      .query('messages')
      .withIndex('by_seedKey', (q) => q.eq('seedKey', seedMessageKey))
      .unique()
    const you = await youUser(ctx)
    if (!you) throw new Error("Seed user missing — run dev/seedDemo:seed first (Phase 2 uses the hardcoded 'you' identity)")
    const now = Date.now()
    const huddleId = await ctx.db.insert('huddles', {
      topicId: topic._id,
      state: 'active',
      createdById: you._id,
      createdAt: now,
      originDmId: dm?._id,
      promotedAt: now,
      seedMessageId: seedMsg?._id,
      seedKey,
    })
    const users = await ctx.db.query('users').collect()
    await ctx.db.insert('huddleMembers', { huddleId, userId: you._id })
    for (const name of memberNames) {
      if (name === 'You') continue
      const u = users.find((u) => u.name === name)
      if (u && u._id !== you._id) await ctx.db.insert('huddleMembers', { huddleId, userId: u._id })
    }
    return huddleId
  },
})

export const remove = mutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const h = await findHuddleByKey(ctx, key)
    if (!h) return
    const members = await ctx.db
      .query('huddleMembers')
      .withIndex('by_huddle', (q) => q.eq('huddleId', h._id))
      .collect()
    for (const m of members) await ctx.db.delete(m._id)
    const msgs = await ctx.db
      .query('messages')
      .withIndex('by_parent', (q) => q.eq('parentKind', 'huddle').eq('parentId', h._id as string))
      .collect()
    for (const m of msgs) {
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
    }
    await ctx.db.delete(h._id)
  },
})
