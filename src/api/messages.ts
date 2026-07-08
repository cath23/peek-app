/**
 * Merged message/reply reads.
 *
 * Phase 1 internals: exactly what the view hooks did inline — static mocks
 * merged with the runtime override layers, deletions filtered, replyCount
 * computed. Components receive final values and never see override maps.
 * Phase 2 swaps each hook's internals to a Convex query.
 */
import { TOPIC_CONVERSATIONS } from '@/data/topicData'
import { DM_CONVERSATIONS } from '@/data/dmData'
import { REPLIES } from '@/data/replyData'
import { useTopicMutations } from '@/api/internal/topicMutations'
import { useTopicStore } from '@/api/internal/topicStore'
import { useDmRuntime } from './store'
import { useHuddleLookup } from './huddles'
import type { ConversationData, ConvGroup, Huddle, ReactionData, ReplyData } from './types'

/** A reply as rendered in a thread: static shape + runtime reactions. */
export interface ThreadReply extends ReplyData {
  reactions?: ReactionData[]
}

export interface TopicMessages {
  /** Static conversation groups — deletions filtered, overrides merged. */
  groups: ConvGroup[]
  /** Runtime-sent messages — overrides merged. Rendered under "Today". */
  sent: ConversationData[]
  /** groups + sent flattened (post-merge). */
  all: ConversationData[]
  openCount: number
  resolvedCount: number
  /** Invitees ∪ message authors ∪ static reply authors (display names). */
  members: string[]
  hasAnyPublicMessages: boolean
}

export interface ThreadData {
  conversation: ConversationData | null
  /** Static replies, overrides merged. Render above any promotion divider. */
  replies: ThreadReply[]
  /** Runtime-sent replies, overrides merged. */
  sentReplies: ThreadReply[]
  /** Resolution bookkeeping for the parent (drives inline resolution editing). */
  resolvedByReplyId: string | undefined
  resolutionMessage: string | undefined
}

type Overrides = ReturnType<typeof useTopicMutations>

function mergeConv(c: ConversationData, o: Overrides): ConversationData {
  const resolution = o.resolvedOverrides[c.id]
  return {
    ...c,
    body: o.bodyOverrides[c.id] ?? c.body,
    highlightType: c.id in o.highlightOverrides ? o.highlightOverrides[c.id] : c.highlightType,
    reactions: o.reactionOverrides[c.id] ?? c.reactions,
    isResolved: resolution?.resolved ?? c.isResolved,
    resolvedBy: resolution?.resolvedBy ?? c.resolvedBy,
    resolutionMessage: resolution?.message ?? c.resolutionMessage,
    replyCount:
      (REPLIES[c.id]?.length ?? c.replyCount ?? 0) + (o.sentReplies[c.id]?.length ?? 0),
  }
}

function mergeReply(r: ReplyData, o: Overrides): ThreadReply {
  return {
    ...r,
    body: o.bodyOverrides[r.id] ?? r.body,
    highlightType: r.id in o.highlightOverrides ? o.highlightOverrides[r.id] : r.highlightType,
    reactions: o.reactionOverrides[r.id],
  }
}

const EMPTY_TOPIC: TopicMessages = {
  groups: [],
  sent: [],
  all: [],
  openCount: 0,
  resolvedCount: 0,
  members: [],
  hasAnyPublicMessages: false,
}

export function useTopicMessages(topicId: string | null): TopicMessages {
  const o = useTopicMutations()
  const { findTopic } = useTopicStore()
  if (topicId == null) return EMPTY_TOPIC

  const topic = findTopic(topicId)
  const staticGroups = TOPIC_CONVERSATIONS[topicId] ?? []
  const groups = staticGroups
    .map((g) => ({
      dateLabel: g.dateLabel,
      convs: g.convs.filter((c) => !o.deletedIds.has(c.id)).map((c) => mergeConv(c, o)),
    }))
    .filter((g) => g.convs.length > 0)
  const sent = (o.sentMessages[topicId] ?? []).map((c) => mergeConv(c, o))
  const all = [...groups.flatMap((g) => g.convs), ...sent]

  const openCount = all.filter((c) => !(c.isResolved ?? false)).length
  const resolvedCount = all.length - openCount
  const replyAuthors = all.flatMap((c) => (REPLIES[c.id] ?? []).map((r) => r.authorName))
  const members = Array.from(
    new Set([...(topic?.invitees ?? []), ...all.map((c) => c.authorName), ...replyAuthors]),
  )
  const hasAnyPublicMessages =
    staticGroups.some((g) => g.convs.some((c) => !o.deletedIds.has(c.id))) || sent.length > 0

  return { groups, sent, all, openCount, resolvedCount, members, hasAnyPublicMessages }
}

export interface DmMessages {
  groups: ConvGroup[]
  sent: ConversationData[]
}

export function useDmMessages(dmId: number | null): DmMessages {
  const o = useTopicMutations()
  const { sentDmMessages } = useDmRuntime()
  if (dmId == null) return { groups: [], sent: [] }

  const groups = (DM_CONVERSATIONS[dmId] ?? [])
    .map((g) => ({
      dateLabel: g.dateLabel,
      convs: g.convs.filter((c) => !o.deletedIds.has(c.id)).map((c) => mergeConv(c, o)),
    }))
    .filter((g) => g.convs.length > 0)
  const sent = (sentDmMessages[dmId] ?? []).map((c) => mergeConv(c, o))
  return { groups, sent }
}

/**
 * Merged top-level messages inside a huddle: seed conversation (if any),
 * static extras, and runtime-sent messages — in that order, as the huddle
 * main view renders them.
 */
export function useHuddleMessages(huddle: Huddle | null): ConversationData[] {
  const o = useTopicMutations()
  if (!huddle) return []
  return [
    ...(huddle.conversation ? [huddle.conversation] : []),
    ...(huddle.extraConvs ?? []),
    ...(o.huddleSentMessages[huddle.id] ?? []),
  ].map((c) => mergeConv(c, o))
}

/**
 * Global message lookup for the thread panel. Message ids are unique across
 * topics, DMs, and huddles, so the thread panel can resolve its conversation
 * without container context (mirrors — and supersedes — the per-view lookup
 * pools the view hooks used to build).
 */
export function useThread(messageId: string | null): ThreadData {
  const o = useTopicMutations()
  const { topics } = useTopicStore()
  const { sentDmMessages } = useDmRuntime()
  const huddleLookup = useHuddleLookup()

  if (!messageId) {
    return { conversation: null, replies: [], sentReplies: [], resolvedByReplyId: undefined, resolutionMessage: undefined }
  }

  const find = (): ConversationData | undefined => {
    for (const groups of Object.values(TOPIC_CONVERSATIONS)) {
      for (const g of groups) {
        const hit = g.convs.find((c) => c.id === messageId)
        if (hit) return hit
      }
    }
    for (const msgs of Object.values(o.sentMessages)) {
      const hit = msgs.find((c) => c.id === messageId)
      if (hit) return hit
    }
    for (const groups of Object.values(DM_CONVERSATIONS)) {
      for (const g of groups) {
        const hit = g.convs.find((c) => c.id === messageId)
        if (hit) return hit
      }
    }
    for (const msgs of Object.values(sentDmMessages)) {
      const hit = msgs.find((c) => c.id === messageId)
      if (hit) return hit
    }
    // Huddle seed/extra/runtime messages (incl. runtime topics' huddles).
    for (const t of topics) {
      for (const h of huddleLookup(t.id)) {
        if (h.conversation?.id === messageId) return h.conversation
        const extra = h.extraConvs?.find((c) => c.id === messageId)
        if (extra) return extra
        const sent = (o.huddleSentMessages[h.id] ?? []).find((c) => c.id === messageId)
        if (sent) return sent
      }
    }
    return undefined
  }

  const raw = find()
  const conversation = raw ? mergeConv(raw, o) : null
  const replies = (REPLIES[messageId] ?? []).map((r) => mergeReply(r, o))
  const sentReplies = (o.sentReplies[messageId] ?? []).map((r) => mergeReply(r, o))
  const resolution = o.resolvedOverrides[messageId]

  return {
    conversation,
    replies,
    sentReplies,
    resolvedByReplyId: resolution?.resolvedByReplyId,
    resolutionMessage: resolution?.message,
  }
}

/**
 * Live reply count for a message (static + runtime-sent), with the static
 * mock's hardcoded replyCount as fallback. Same formula the cards use.
 */
export function useReplyCount(): (messageId: string | undefined, fallback?: number) => number {
  const o = useTopicMutations()
  return (messageId, fallback = 0) => {
    if (!messageId) return fallback
    return (REPLIES[messageId]?.length ?? fallback) + (o.sentReplies[messageId]?.length ?? 0)
  }
}
