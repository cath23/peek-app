/**
 * Merged message/reply reads.
 *
 * Phase 1 internals: exactly what the view hooks did inline — static mocks
 * merged with the runtime override layers, deletions filtered, replyCount
 * computed. Components receive final values and never see override maps.
 * Phase 2 swaps each hook's internals to a Convex query.
 */
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { TOPIC_CONVERSATIONS } from '@/data/topicData'
import { DM_CONVERSATIONS } from '@/data/dmData'
import { REPLIES } from '@/data/replyData'
import { useTopicMutations } from '@/api/internal/topicMutations'
import { useTopicStore } from '@/api/internal/topicStore'
import { formatDateLabel, formatTimestamp, dayKey } from './format'
import { hasConvex, useDmRuntime } from './store'
import { useHuddleLookup } from './huddles'
import type { ConversationData, ConvGroup, Huddle, ReactionData, ReplyData } from './types'

/** Row shape returned by convex/messages.ts list/get. */
interface RemoteMessage {
  id: string
  authorName: string
  createdAt: number
  body: string
  isUrgent?: boolean
  highlightType?: ConversationData['highlightType']
  isResolved?: boolean
  resolvedBy?: string
  resolutionMessage?: string
  resolvedByReplyId?: string
  attachments?: string[]
  /** Derived server-side (list only). */
  replyCount?: number
  /** Aggregated server-side from per-user rows (§4.6). */
  reactions?: ReactionData[]
}

/** Row shape returned by convex/replies.ts list. */
interface RemoteReply {
  id: string
  authorName: string
  createdAt: number
  body: string
  isUrgent?: boolean
  highlightType?: ConversationData['highlightType']
  attachments?: string[]
}

/** Remote reply → presentation shape; the mock reply with the same id bridges the seeded isNew flag (readState is Phase 4). */
function toReplyData(r: RemoteReply, mock: ReplyData | undefined): ReplyData {
  return {
    id: r.id,
    authorName: r.authorName,
    timestamp: formatTimestamp(r.createdAt),
    body: r.body,
    isNew: mock?.isNew,
    isUrgent: r.isUrgent,
    highlightType: r.highlightType,
    attachments: r.attachments,
    createdAtMs: r.createdAt,
  }
}

/**
 * Remote row → presentation shape. The mock record with the same id (when
 * one exists) bridges the fields whose entities haven't swapped yet:
 * reactions (per-user rows come later) and the seeded unread flags
 * (readState is Phase 4).
 */
function toConversationData(r: RemoteMessage, mock: ConversationData | undefined): ConversationData {
  return {
    id: r.id,
    authorName: r.authorName,
    timestamp: formatTimestamp(r.createdAt),
    body: r.body,
    isUrgent: r.isUrgent,
    highlightType: r.highlightType,
    isResolved: r.isResolved,
    resolvedBy: r.resolvedBy,
    resolutionMessage: r.resolutionMessage,
    attachments: r.attachments ?? mock?.attachments,
    reactions: r.reactions,
    hasNewMessage: mock?.hasNewMessage,
    hasNewReply: mock?.hasNewReply,
    replyCount: r.replyCount ?? mock?.replyCount,
  }
}

/** Group remote rows (already oldest-first) into per-local-day ConvGroups. */
function groupRemoteByDay(rows: RemoteMessage[], toConv: (r: RemoteMessage) => ConversationData): ConvGroup[] {
  const groups: { key: string; dateLabel: string; convs: ConversationData[] }[] = []
  for (const r of rows) {
    const key = dayKey(r.createdAt)
    let group = groups.length > 0 && groups[groups.length - 1].key === key ? groups[groups.length - 1] : undefined
    if (!group) {
      group = { key, dateLabel: formatDateLabel(r.createdAt), convs: [] }
      groups.push(group)
    }
    group.convs.push(toConv(r))
  }
  return groups.map(({ dateLabel, convs }) => ({ dateLabel, convs }))
}

function mockMessagesById(groups: ConvGroup[] | undefined): Map<string, ConversationData> {
  const map = new Map<string, ConversationData>()
  for (const g of groups ?? []) for (const c of g.convs) map.set(c.id, c)
  return map
}

/** A reply as rendered in a thread: static shape + runtime reactions. */
export interface ThreadReply extends ReplyData {
  reactions?: ReactionData[]
}

export interface TopicMessages {
  /** Persisted conversation groups — deletions filtered, overrides merged. */
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
  /** True while the Convex query is in flight — render a skeleton, not an empty state. */
  isLoading: boolean
}

export interface ThreadData {
  conversation: ConversationData | null
  /** Persisted replies, overrides merged. Render above any promotion divider. */
  replies: ThreadReply[]
  /** Runtime-sent replies, overrides merged. */
  sentReplies: ThreadReply[]
  /** Resolution bookkeeping for the parent (drives inline resolution editing). */
  resolvedByReplyId: string | undefined
  resolutionMessage: string | undefined
  /** True while the Convex replies query is in flight. */
  isLoading: boolean
}

type Overrides = ReturnType<typeof useTopicMutations>

/**
 * `recountReplies` distinguishes the two read paths: the mock path derives
 * the count from the static REPLIES map + session-sent replies; the Convex
 * path trusts the server count already on the row (the reactive query
 * catches up within a beat of a reply landing).
 */
function mergeConv(c: ConversationData, o: Overrides, recountReplies = true): ConversationData {
  const resolution = o.resolvedOverrides[c.id]
  return {
    ...c,
    body: o.bodyOverrides[c.id] ?? c.body,
    highlightType: c.id in o.highlightOverrides ? o.highlightOverrides[c.id] : c.highlightType,
    reactions: o.reactionOverrides[c.id] ?? c.reactions,
    isResolved: resolution?.resolved ?? c.isResolved,
    resolvedBy: resolution?.resolvedBy ?? c.resolvedBy,
    resolutionMessage: resolution?.message ?? c.resolutionMessage,
    replyCount: recountReplies
      ? (REPLIES[c.id]?.length ?? c.replyCount ?? 0) + (o.sentReplies[c.id]?.length ?? 0)
      : c.replyCount ?? 0,
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
  isLoading: false,
}

export function useTopicMessages(topicId: string | null): TopicMessages {
  const o = useTopicMutations()
  const { findTopic } = useTopicStore()
  const remote = useQuery(
    api.messages.list,
    hasConvex && topicId != null ? { parentKind: 'topic', parentKey: topicId } : 'skip',
  )
  if (topicId == null) return EMPTY_TOPIC

  const topic = findTopic(topicId)
  const sentLocal = o.sentMessages[topicId] ?? []
  let groups: ConvGroup[]
  let sent: ConversationData[]
  if (hasConvex) {
    if (remote === undefined) return { ...EMPTY_TOPIC, isLoading: true }
    const mockById = mockMessagesById(TOPIC_CONVERSATIONS[topicId])
    const rows = remote.filter((r) => !o.deletedIds.has(r.id))
    groups = groupRemoteByDay(rows, (r) => mergeConv(toConversationData(r, mockById.get(r.id)), o, false))
    // The confirmed copy renders from the query; the local copy covers the
    // optimistic window only.
    const remoteIds = new Set(remote.map((r) => r.id))
    sent = sentLocal.filter((c) => !remoteIds.has(c.id)).map((c) => mergeConv(c, o))
  } else {
    groups = (TOPIC_CONVERSATIONS[topicId] ?? [])
      .map((g) => ({
        dateLabel: g.dateLabel,
        convs: g.convs.filter((c) => !o.deletedIds.has(c.id)).map((c) => mergeConv(c, o)),
      }))
      .filter((g) => g.convs.length > 0)
    sent = sentLocal.map((c) => mergeConv(c, o))
  }
  const all = [...groups.flatMap((g) => g.convs), ...sent]

  const openCount = all.filter((c) => !(c.isResolved ?? false)).length
  const resolvedCount = all.length - openCount
  const replyAuthors = all.flatMap((c) => (REPLIES[c.id] ?? []).map((r) => r.authorName))
  const members = Array.from(
    new Set([...(topic?.invitees ?? []), ...all.map((c) => c.authorName), ...replyAuthors]),
  )
  const hasAnyPublicMessages = all.length > 0

  return { groups, sent, all, openCount, resolvedCount, members, hasAnyPublicMessages, isLoading: false }
}

export interface DmMessages {
  groups: ConvGroup[]
  sent: ConversationData[]
  /** True while the Convex query is in flight — render a skeleton, not an empty state. */
  isLoading: boolean
}

export function useDmMessages(dmId: number | null): DmMessages {
  const o = useTopicMutations()
  const { sentDmMessages } = useDmRuntime()
  const remote = useQuery(
    api.messages.list,
    hasConvex && dmId != null ? { parentKind: 'dm', parentKey: String(dmId) } : 'skip',
  )
  if (dmId == null) return { groups: [], sent: [], isLoading: false }

  const sentLocal = sentDmMessages[dmId] ?? []
  let groups: ConvGroup[]
  let sent: ConversationData[]
  if (hasConvex) {
    if (remote === undefined) return { groups: [], sent: [], isLoading: true }
    const mockById = mockMessagesById(DM_CONVERSATIONS[dmId])
    const rows = remote.filter((r) => !o.deletedIds.has(r.id))
    groups = groupRemoteByDay(rows, (r) => mergeConv(toConversationData(r, mockById.get(r.id)), o, false))
    const remoteIds = new Set(remote.map((r) => r.id))
    sent = sentLocal.filter((c) => !remoteIds.has(c.id)).map((c) => mergeConv(c, o))
  } else {
    groups = (DM_CONVERSATIONS[dmId] ?? [])
      .map((g) => ({
        dateLabel: g.dateLabel,
        convs: g.convs.filter((c) => !o.deletedIds.has(c.id)).map((c) => mergeConv(c, o)),
      }))
      .filter((g) => g.convs.length > 0)
    sent = sentLocal.map((c) => mergeConv(c, o))
  }
  return { groups, sent, isLoading: false }
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
  // Refresh fallback: a message sent in an earlier session exists only in
  // Convex — the local pools below can't see it (mock data + this session's
  // sent stores only).
  const remoteMsg = useQuery(api.messages.get, hasConvex && messageId ? { key: messageId } : 'skip')
  const remoteReplies = useQuery(api.replies.list, hasConvex && messageId ? { messageKey: messageId } : 'skip')

  if (!messageId) {
    return { conversation: null, replies: [], sentReplies: [], resolvedByReplyId: undefined, resolutionMessage: undefined, isLoading: false }
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

  const raw = find() ?? (remoteMsg ? toConversationData(remoteMsg, undefined) : undefined)
  const conversation = raw ? mergeConv(raw, o) : null

  const sentLocal = o.sentReplies[messageId] ?? []
  let replies: ThreadReply[]
  let sentReplies: ThreadReply[]
  let isLoading = false
  if (hasConvex) {
    if (remoteReplies === undefined) {
      replies = []
      sentReplies = []
      isLoading = true
    } else {
      const mockById = new Map((REPLIES[messageId] ?? []).map((r) => [r.id, r]))
      replies = remoteReplies.map((r) => mergeReply(toReplyData(r, mockById.get(r.id)), o))
      const remoteIds = new Set(remoteReplies.map((r) => r.id))
      sentReplies = sentLocal.filter((r) => !remoteIds.has(r.id)).map((r) => mergeReply(r, o))
    }
  } else {
    replies = (REPLIES[messageId] ?? []).map((r) => mergeReply(r, o))
    sentReplies = sentLocal.map((r) => mergeReply(r, o))
  }
  const resolution = o.resolvedOverrides[messageId]

  return {
    conversation,
    replies,
    sentReplies,
    // A session override wins outright (even a reopen, which clears the
    // pointer); otherwise the persisted resolution from Convex applies.
    resolvedByReplyId: resolution ? resolution.resolvedByReplyId : remoteMsg?.resolvedByReplyId,
    resolutionMessage: resolution ? resolution.message : remoteMsg?.resolutionMessage,
    isLoading,
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
