/**
 * Current-user identity.
 *
 * Phase 1/2: the hardcoded prototype convention — the current user is the
 * literal author name 'You' (domain model §1). Phase 3 (auth) replaces this
 * with the authenticated user's id; "You" becomes a render-time label for
 * `authorId === currentUser.id`. All seam writes stamp this constant so the
 * eventual sweep has one obvious seam-side switch point.
 */
export const CURRENT_USER_NAME = 'You'

export function isCurrentUser(authorName: string): boolean {
  return authorName === CURRENT_USER_NAME
}
