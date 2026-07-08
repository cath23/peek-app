/**
 * Topic reads + creation (domain model §2.2–2.3).
 *
 * Phase 2 transitional shape: `id` is the seedKey where present so the
 * client can keep joining mock-keyed messages/huddles during the
 * entity-by-entity swap. `memberNames` renders the seed user as 'You'
 * (the CURRENT_USER_NAME convention) until Phase 3 auth.
 * isResolved is DERIVED (§4.1) and never returned here — the client's
 * resolution source of truth stays on the messages side until that entity
 * swaps.
 */
import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

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
      for (const m of members) {
        const u = await ctx.db.get(m.userId)
        if (u) memberNames.push(u.seedKey === 'you' ? 'You' : u.name)
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
        isResolved,
      })
    }
    return out.sort((a, b) => a.createdAt - b.createdAt)
  },
})

export const create = mutation({
  args: {
    title: v.string(),
    /** Client-generated id (t_<ts>_<seq>) — the transition bridge so the
     *  optimistic local topic and this record are the same topic. */
    seedKey: v.string(),
    inviteeNames: v.array(v.string()),
  },
  handler: async (ctx, { title, seedKey, inviteeNames }) => {
    const you = await ctx.db
      .query('users')
      .withIndex('by_seedKey', (q) => q.eq('seedKey', 'you'))
      .unique()
    if (!you) throw new Error("Seed user missing — run dev/seedDemo:seed first (Phase 2 uses the hardcoded 'you' identity)")
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
