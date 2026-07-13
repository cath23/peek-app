/**
 * Unread derivation. Phase 4 replaces these with readState-backed queries
 * (watermarks per container AND per thread — domain model §4.3); until then
 * they read the seeded flags in the mocks.
 *
 * The seam speaks person keys for DMs (§2.4); the mock fixture is still
 * keyed by its legacy conversation numbers, so we bridge here.
 */
import { dmHasUnread as mockDmHasUnread } from '@/data/dmData'
import { mockConvIdFor } from './directory'

export { topicHasUnread } from '@/data/topicData'

/** `dmId` is the partner's person key. */
export function dmHasUnread(dmId: string): boolean {
  const convId = mockConvIdFor(dmId)
  return convId === undefined ? false : mockDmHasUnread(convId)
}
