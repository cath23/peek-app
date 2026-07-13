/**
 * Unread — two signals, two watermarks (§4.3; ruling 2026-07-09).
 *
 *   hasNewMessage → cleared by opening the topic/DM (after a short dwell)
 *   hasNewReply / isNew → cleared only by opening THAT message's thread panel
 *
 * Convex mode derives both per viewer from `readState`; mock mode keeps the
 * fixture's seeded flags so the demo renders identically. (The fixture is
 * still keyed by legacy DM conversation numbers — bridged here.)
 */
import { useCallback } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { topicHasUnread as mockTopicHasUnread } from '@/data/topicData'
import { dmHasUnread as mockDmHasUnread } from '@/data/dmData'
import { mockConvIdFor } from './directory'
import { hasConvex } from './store'

/** Sidebar dots: does this topic / DM hold anything new for me? */
export function useUnread(): {
  topicHasUnread: (topicId: string) => boolean
  dmHasUnread: (dmId: string) => boolean
} {
  const remote = useQuery(api.unread.summary, hasConvex ? {} : 'skip')

  const topicHasUnread = useCallback(
    (topicId: string) => {
      if (!hasConvex) return mockTopicHasUnread(topicId)
      return remote?.topics.includes(topicId) ?? false
    },
    [remote],
  )

  const dmHasUnread = useCallback(
    (dmId: string) => {
      if (!hasConvex) {
        const convId = mockConvIdFor(dmId)
        return convId === undefined ? false : mockDmHasUnread(convId)
      }
      return remote?.dms.includes(dmId) ?? false
    },
    [remote],
  )

  return { topicHasUnread, dmHasUnread }
}

/** How long a conversation/thread must stay open before it counts as read. */
export const READ_DWELL_MS = 1500

/**
 * Mark-as-read writers. Call these from a dwell timer, never on mount alone —
 * flicking past a conversation shouldn't consume its unread state.
 */
export function useReadActions() {
  const markContainerRemote = useMutation(api.readState.markContainerRead)
  const markThreadRemote = useMutation(api.readState.markThreadRead)

  return {
    markContainerRead(parentKind: 'topic' | 'dm' | 'huddle', parentKey: string) {
      if (!hasConvex) return
      void markContainerRemote({ parentKind, parentKey })
    },
    markThreadRead(messageKey: string) {
      if (!hasConvex) return
      void markThreadRemote({ messageKey })
    },
  }
}
