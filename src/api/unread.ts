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

/**
 * Sidebar indicators, per viewer:
 *   `*HasUnread` → the accent dot (non-urgent).
 *   `*IsUrgent`  → the warning indicator; an unread URGENT message shows this
 *                  instead of the dot (issue #11). Mock mode has no urgent
 *                  derivation, so it's always false there.
 */
export function useUnread(): {
  topicHasUnread: (topicId: string) => boolean
  dmHasUnread: (dmId: string) => boolean
  topicIsUrgent: (topicId: string) => boolean
  dmIsUrgent: (dmId: string) => boolean
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

  const topicIsUrgent = useCallback(
    (topicId: string) => (hasConvex ? (remote?.urgentTopics.includes(topicId) ?? false) : false),
    [remote],
  )
  const dmIsUrgent = useCallback(
    (dmId: string) => (hasConvex ? (remote?.urgentDms.includes(dmId) ?? false) : false),
    [remote],
  )

  return { topicHasUnread, dmHasUnread, topicIsUrgent, dmIsUrgent }
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
