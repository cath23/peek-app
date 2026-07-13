/**
 * Merged huddle reads.
 *
 * Convex-backed when a deployment is configured: one huddles.list query
 * feeds both the per-topic and per-origin-DM lookups; runtime-created
 * huddles (promotions this session) merge over it for the optimistic
 * window (remote wins on id). Mock path unchanged: static TOPIC_HUDDLES +
 * runtime stores, deletions filtered, seed-body override applied.
 */
import { useCallback } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useTopicMutations } from '@/api/internal/topicMutations'
import { useTopicStore } from '@/api/internal/topicStore'
import { CURRENT_USER_NAME, useCurrentUser } from './currentUser'
import { formatDateLabel, formatPromotedAt } from './format'
import { toConversationData, type RemoteMessage } from './messages'
import { hasConvex } from './store'
import type { Huddle } from './types'

interface RemoteHuddle {
  id: string
  topicId: string
  members: string[]
  /** Index-aligned with members — the seam renders the viewer as 'You'. */
  memberIds: string[]
  state: 'active' | 'resolved'
  lastActivityMs: number
  conversation?: RemoteMessage
  extraConvs: RemoteMessage[]
  originDmKey?: string
  promotedAtMs?: number
  seedMessageId?: string
}

function toHuddle(r: RemoteHuddle, meId: string | undefined): Huddle {
  return {
    id: r.id,
    topicId: r.topicId,
    members: r.members.map((n, i) => (r.memberIds[i] === meId ? CURRENT_USER_NAME : n)),
    state: r.state,
    lastActivity: formatDateLabel(r.lastActivityMs),
    conversation: r.conversation ? toConversationData(r.conversation, meId) : undefined,
    extraConvs: r.extraConvs.map((c) => toConversationData(c, meId)),
    originDmId: r.originDmKey,
    promotedAt: r.promotedAtMs !== undefined ? formatPromotedAt(r.promotedAtMs) : undefined,
    promotedAtMs: r.promotedAtMs,
    seedMessageId: r.seedMessageId,
  }
}

function useRemoteHuddles(): RemoteHuddle[] | undefined {
  return useQuery(api.huddles.list, hasConvex ? {} : 'skip')
}

/** Local overrides applied to a merged huddle list (both read paths). */
function applyOverrides(
  huddles: Huddle[],
  o: ReturnType<typeof useTopicMutations>,
): Huddle[] {
  return huddles
    .filter((h) => !o.deletedHuddleIds.has(h.id))
    .map((h) => {
      if (!h.conversation) return h
      const override = o.huddleBodyOverrides[h.conversation.id]
      if (override) return { ...h, conversation: { ...h.conversation, body: override } }
      return h
    })
}

/** Merged huddles for a topic. Function form so lists can call it per row. */
export function useHuddleLookup(): (topicId: string) => Huddle[] {
  const { getHuddlesForTopic, getExtraHuddlesForTopic } = useTopicStore()
  const o = useTopicMutations()
  const me = useCurrentUser()
  const remote = useRemoteHuddles()
  return useCallback(
    (topicId: string) => {
      if (!hasConvex) {
        return applyOverrides(
          [...getHuddlesForTopic(topicId), ...(o.createdHuddles[topicId] ?? [])],
          o,
        )
      }
      const fromRemote = (remote ?? []).filter((h) => h.topicId === topicId).map((h) => toHuddle(h, me?.id))
      const remoteIds = new Set(fromRemote.map((h) => h.id))
      const localOnly = [
        ...getExtraHuddlesForTopic(topicId),
        ...(o.createdHuddles[topicId] ?? []),
      ].filter((h) => !remoteIds.has(h.id))
      return applyOverrides([...fromRemote, ...localOnly], o)
    },
    [getHuddlesForTopic, getExtraHuddlesForTopic, o, remote, me],
  )
}

/** True while the Convex huddles query is in flight (drives the grid skeleton). */
export function useHuddlesLoading(): boolean {
  const remote = useRemoteHuddles()
  return hasConvex && remote === undefined
}

/** All huddles promoted from a given DM (there can be several). */
export function usePromotedHuddleLookup(): (dmId: string) => Huddle[] {
  const { findAllHuddlesByOriginDm, findExtraHuddlesByOriginDm } = useTopicStore()
  const o = useTopicMutations()
  const me = useCurrentUser()
  const remote = useRemoteHuddles()
  return useCallback(
    (dmId: string) => {
      if (!hasConvex) return findAllHuddlesByOriginDm(dmId)
      const fromRemote = (remote ?? [])
        .filter((h) => h.originDmKey === dmId)
        .map((h) => toHuddle(h, me?.id))
      const remoteIds = new Set(fromRemote.map((h) => h.id))
      const localOnly = findExtraHuddlesByOriginDm(dmId).filter((h) => !remoteIds.has(h.id))
      return applyOverrides([...fromRemote, ...localOnly], o)
    },
    [findAllHuddlesByOriginDm, findExtraHuddlesByOriginDm, o, remote, me],
  )
}
