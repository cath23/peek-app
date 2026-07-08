import type { ReplyData } from '@/data/replyData'

/** Result of splitting a reply list around a promotion event. */
export interface PartitionResult {
  /** Replies rendered above the divider — static replies + pre-promotion sentReplies. */
  above: ReplyData[]
  /** Replies rendered below the divider — post-promotion sentReplies. */
  below: ReplyData[]
}

/**
 * Split replies around a topic-promotion event for the thread panel.
 *
 * - Static `replies` (from mock data) lack a numeric timestamp and represent
 *   pre-existing data, so they always go above the divider.
 * - Runtime `sentReplies` are split by `createdAtMs` vs `promotedAtMs`:
 *   < promotedAtMs → above, >= promotedAtMs → below.
 * - When `promotedAtMs` is undefined (no promotion or no chronological anchor),
 *   no split happens: all sentReplies are merged with replies into `above`.
 */
export function partitionRepliesAroundPromotion({
  replies,
  sentReplies,
  promotedAtMs,
}: {
  replies: ReplyData[]
  sentReplies: ReplyData[]
  promotedAtMs: number | undefined
}): PartitionResult {
  if (promotedAtMs == null) {
    return { above: [...replies, ...sentReplies], below: [] }
  }
  const preDivider = sentReplies.filter((r) => (r.createdAtMs ?? 0) < promotedAtMs)
  const postDivider = sentReplies.filter((r) => (r.createdAtMs ?? 0) >= promotedAtMs)
  return { above: [...replies, ...preDivider], below: postDivider }
}
