/**
 * Current-user identity (Phase 3).
 *
 * Convex mode: the authenticated user from `users.me`; the seam's read
 * mappers compare row `authorId`/member ids against `useCurrentUser().id`
 * and render the viewer's own rows as the 'You' label — components keep
 * the label contract unchanged. Mock mode keeps the prototype convention
 * (the literal author name 'You').
 */
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { hasConvex } from './store'

/** The render-time label for the viewer's own rows. */
export const CURRENT_USER_NAME = 'You'

export function isCurrentUser(authorName: string): boolean {
  return authorName === CURRENT_USER_NAME
}

export interface CurrentUser {
  id: string
  name: string
  email?: string
  role?: string
  /** Uploaded avatar (Convex file storage); absent until the user sets one. */
  avatarUrl?: string
  /** Set only for the demo fixture's user — keeps the demo's portrait. */
  seedKey?: string
}

const MOCK_CURRENT_USER: CurrentUser = { id: 'you', name: CURRENT_USER_NAME, seedKey: 'you' }

/**
 * The signed-in user. `undefined` while the profile query is in flight
 * (Convex mode only — the seam's read hooks treat that as loading).
 */
export function useCurrentUser(): CurrentUser | undefined {
  const me = useQuery(api.users.me, hasConvex ? {} : 'skip')
  if (!hasConvex) return MOCK_CURRENT_USER
  if (me === undefined || me === null) return undefined
  return {
    id: me.id,
    name: me.name,
    email: me.email,
    role: me.role,
    avatarUrl: me.avatarUrl,
    seedKey: me.seedKey,
  }
}
