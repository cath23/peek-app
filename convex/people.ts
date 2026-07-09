/**
 * People reads — the workspace directory (domain model §2.1).
 *
 * `id` is the stable seedKey where present (see convex/schema.ts) and the
 * authenticated viewer is excluded by id (People lists everyone else).
 */
import { query } from './_generated/server'
import { viewerId } from './users'

export const list = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect()
    const me = await viewerId(ctx)
    return users
      .filter((u) => u._id !== me)
      .map((u) => ({
        id: u.seedKey ?? (u._id as string),
        name: u.name,
        role: u.role ?? '',
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  },
})
