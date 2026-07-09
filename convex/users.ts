/**
 * Viewer identity (Phase 3). Every function resolves the current user from
 * `ctx.auth` via Convex Auth — the hardcoded 'you' seed identity is gone.
 * Queries return empty results when unauthenticated (the client gate keeps
 * that momentary); mutations throw.
 */
import { getAuthUserId } from '@convex-dev/auth/server'
import { query, type QueryCtx, type MutationCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'

/** The authenticated user's id, or null when unauthenticated. */
export async function viewerId(ctx: QueryCtx | MutationCtx): Promise<Id<'users'> | null> {
  return getAuthUserId(ctx)
}

/** The authenticated user's doc, or null when unauthenticated. */
export async function viewer(ctx: QueryCtx | MutationCtx): Promise<Doc<'users'> | null> {
  const id = await getAuthUserId(ctx)
  return id ? ctx.db.get(id) : null
}

/** The authenticated user's doc; throws for mutations that must not run signed out. */
export async function viewerOrThrow(ctx: QueryCtx | MutationCtx): Promise<Doc<'users'>> {
  const u = await viewer(ctx)
  if (!u) throw new Error('Not signed in')
  return u
}

/** The signed-in user's own profile — drives the client's useCurrentUser(). */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const u = await viewer(ctx)
    if (!u) return null
    return {
      id: u._id as string,
      name: u.name,
      email: u.email,
      role: u.role,
      seedKey: u.seedKey,
    }
  },
})
