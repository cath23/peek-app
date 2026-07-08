/**
 * Unread derivation. Phase 4 replaces these with readState-backed queries
 * (one lastReadAt watermark per container — domain model §4.3); until then
 * they read the seeded flags in the mocks.
 */
export { topicHasUnread } from '@/data/topicData'
export { dmHasUnread } from '@/data/dmData'
