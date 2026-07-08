/**
 * People reads — the workspace directory (domain model §2.1).
 *
 * Phase 2 transitional shape: `id` is the seedKey where present (mock id
 * bridge, so partially-swapped entities keep joining on mock ids) and the
 * current user is excluded by the 'you' seedKey convention. Phase 3 replaces
 * the convention with ctx.auth identity.
 */
import { query } from './_generated/server'

export const list = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect()
    return users
      .filter((u) => u.seedKey !== 'you')
      .map((u) => ({
        id: u.seedKey ?? (u._id as string),
        name: u.name,
        role: u.role ?? '',
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  },
})
