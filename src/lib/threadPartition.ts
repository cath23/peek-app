import type { ReplyData } from '@/data/replyData'

/** Result of splitting a reply list around a promotion event. */
export interface PartitionResult<T extends ReplyData = ReplyData> {
  /** Replies rendered above the divider — static replies + pre-promotion sentReplies. */
  above: T[]
  /** Replies rendered below the divider — post-promotion sentReplies. */
  below: T[]
}

/**
 * Split replies around a topic-promotion event for the thread panel.
 *
 * A reply belongs *below* the divider only when it has a numeric `createdAtMs`
 * at or after `promotedAtMs`. This holds regardless of which list it arrives in:
 * once a post-promotion reply persists to Convex it moves from `sentReplies`
 * into `replies`, and it must stay below the divider through that transition
 * rather than jumping above it (which would shove the divider to the bottom).
 *
 * - Replies with no `createdAtMs` (static mock history) have no chronological
 *   anchor, so they always stay above as pre-existing context.
 * - When `promotedAtMs` is undefined (no promotion), no split happens: all
 *   replies are merged into `above`.
 *
 * Original relative order is preserved within each side.
 */
export function partitionRepliesAroundPromotion<T extends ReplyData>({
  replies,
  sentReplies,
  promotedAtMs,
}: {
  replies: T[]
  sentReplies: T[]
  promotedAtMs: number | undefined
}): PartitionResult<T> {
  if (promotedAtMs == null) {
    return { above: [...replies, ...sentReplies], below: [] }
  }
  const all = [...replies, ...sentReplies]
  const isBelow = (r: T) => r.createdAtMs != null && r.createdAtMs >= promotedAtMs
  return { above: all.filter((r) => !isBelow(r)), below: all.filter(isBelow) }
}
