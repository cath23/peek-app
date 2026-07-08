/**
 * Write functions — the seam's mutation surface.
 *
 * Phase 1 internals: the exact setter logic previously inlined in
 * useTopicView / useDmConversationView, now stamped with CURRENT_USER_NAME
 * instead of a scattered 'You' literal. Phase 2 swaps each function to a
 * Convex mutation (domain model §2, §7 "runtime state" table).
 */
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useTopicMutations } from '@/api/internal/topicMutations'
import { hasConvex, useDmRuntime } from './store'
import { CURRENT_USER_NAME } from './currentUser'
import type { ConversationData, HighlightType, Huddle, ReactionData, ReplyData } from './types'

export interface SendMessagePayload {
  text: string
  resolution?: { message: string }
  highlightType?: HighlightType
  /** Figma frame ids attached via the launcher's find flow. */
  attachments?: string[]
}

const nowTimestamp = (now = Date.now()) =>
  new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export function usePeekActions() {
  const m = useTopicMutations()
  const { setSentDmMessages } = useDmRuntime()
  // Convex double-writes (no-ops without a deployment): the optimistic local
  // copy renders instantly; the record shares its id via seedKey so the
  // reactive read dedupes when it catches up.
  const sendRemote = useMutation(api.messages.send)
  const editBodyRemote = useMutation(api.messages.editBody)
  const removeRemote = useMutation(api.messages.remove)
  const sendReplyRemote = useMutation(api.replies.send)
  const removeReplyRemote = useMutation(api.replies.remove)
  const setResolutionRemote = useMutation(api.messages.setResolution)
  const setHighlightRemote = useMutation(api.messages.setHighlight)
  const toggleReactionRemote = useMutation(api.messages.toggleReaction)
  const createHuddleRemote = useMutation(api.huddles.create)
  const removeHuddleRemote = useMutation(api.huddles.remove)
  const dismissScreenerRemote = useMutation(api.desk.dismissScreenerItem)
  const snoozeScreenerRemote = useMutation(api.desk.snoozeScreenerItem)
  const removeOpenWorkRemote = useMutation(api.desk.removeOpenWorkItem)

  const persistMessage = (
    parentKind: 'topic' | 'dm' | 'huddle',
    parentKey: string,
    msg: ConversationData,
    dmPartnerName?: string,
  ) => {
    if (!hasConvex) return
    void sendRemote({
      parentKind,
      parentKey,
      seedKey: msg.id,
      body: msg.body,
      highlightType: msg.highlightType,
      resolved: msg.isResolved,
      resolutionMessage: msg.resolutionMessage,
      attachments: msg.attachments,
      dmPartnerName,
    })
  }

  const buildMessage = ({ text, resolution, highlightType, attachments }: SendMessagePayload): ConversationData => ({
    id: `sent_${Date.now()}`,
    authorName: CURRENT_USER_NAME,
    timestamp: nowTimestamp(),
    body: text,
    highlightType,
    isResolved: resolution ? true : undefined,
    resolvedBy: resolution ? CURRENT_USER_NAME : undefined,
    resolutionMessage: resolution?.message || undefined,
    attachments,
  })

  /** Resolution sent with no text: resolve the last runtime-sent message. */
  const resolveLastSent = (msgs: ConversationData[], message: string): ConversationData[] => {
    if (msgs.length === 0) return msgs
    const updated = [...msgs]
    updated[updated.length - 1] = {
      ...updated[updated.length - 1],
      isResolved: true,
      resolvedBy: CURRENT_USER_NAME,
      resolutionMessage: message || undefined,
    }
    return updated
  }

  return {
    // ── Messages ──
    sendTopicMessage(topicId: string, payload: SendMessagePayload) {
      if (payload.text || payload.attachments?.length) {
        const newMsg = buildMessage(payload)
        m.setSentMessages((prev) => ({ ...prev, [topicId]: [...(prev[topicId] ?? []), newMsg] }))
        persistMessage('topic', topicId, newMsg)
      } else if (payload.resolution) {
        const message = payload.resolution.message
        m.setSentMessages((prev) => ({ ...prev, [topicId]: resolveLastSent(prev[topicId] ?? [], message) }))
      }
    },

    sendDmMessage(dmId: number, payload: SendMessagePayload, dmPartnerName?: string) {
      if (payload.text || payload.attachments?.length) {
        const newMsg = buildMessage(payload)
        setSentDmMessages((prev) => ({ ...prev, [dmId]: [...(prev[dmId] ?? []), newMsg] }))
        persistMessage('dm', String(dmId), newMsg, dmPartnerName)
      } else if (payload.resolution) {
        const message = payload.resolution.message
        setSentDmMessages((prev) => ({ ...prev, [dmId]: resolveLastSent(prev[dmId] ?? [], message) }))
      }
    },

    /** Top-level message posted inside a huddle (V2 huddle main view). */
    sendHuddleMessage(huddleId: string, text: string) {
      if (!text) return
      const now = Date.now()
      const newMsg: ConversationData = {
        id: `hsent_${now}`,
        authorName: CURRENT_USER_NAME,
        timestamp: nowTimestamp(now),
        body: text,
      }
      m.setHuddleSentMessages((prev) => ({ ...prev, [huddleId]: [...(prev[huddleId] ?? []), newMsg] }))
      persistMessage('huddle', huddleId, newMsg)
    },

    deleteTopicMessage(topicId: string, messageId: string) {
      m.setSentMessages((prev) => ({ ...prev, [topicId]: (prev[topicId] ?? []).filter((msg) => msg.id !== messageId) }))
      m.setDeletedIds((prev) => new Set([...prev, messageId]))
      if (hasConvex) void removeRemote({ key: messageId })
    },

    deleteDmMessage(dmId: number, messageId: string) {
      setSentDmMessages((prev) => ({ ...prev, [dmId]: (prev[dmId] ?? []).filter((msg) => msg.id !== messageId) }))
      m.setDeletedIds((prev) => new Set([...prev, messageId]))
      if (hasConvex) void removeRemote({ key: messageId })
    },

    /** Body edit — id-keyed, applies to messages and replies alike.
     *  (The Convex write only lands for messages; reply ids miss until the
     *  replies entity swaps.) */
    editBody(id: string, body: string) {
      m.setBodyOverrides((prev) => ({ ...prev, [id]: body }))
      if (hasConvex) void editBodyRemote({ key: id, body })
    },

    /** Body edit for a huddle's SEED conversation (drives the card preview). */
    editHuddleSeedBody(conversationId: string, body: string) {
      m.setHuddleBodyOverrides((prev) => ({ ...prev, [conversationId]: body }))
    },

    setHighlight(id: string, highlightType: HighlightType | undefined) {
      m.setHighlightOverrides((prev) => ({ ...prev, [id]: highlightType }))
      if (hasConvex) void setHighlightRemote({ key: id, highlightType })
    },

    /**
     * Cards keep computing the next aggregate array (instant, pixel-exact);
     * the seam diffs it against `prev` to find the emoji the user toggled
     * and persists that as a per-user row. Only the current user's own
     * reaction can change client-side, so exactly one emoji flips its
     * 'yours' flag per call. Without `prev` (reply reactions — not modeled
     * server-side yet) the change stays session-local.
     */
    setReactions(id: string, reactions: ReactionData[], prev?: ReactionData[]) {
      m.setReactionOverrides((prevMap) => ({ ...prevMap, [id]: reactions }))
      if (!hasConvex || prev === undefined) return
      const emojis = new Set([...prev.map((r) => r.emoji), ...reactions.map((r) => r.emoji)])
      for (const emoji of emojis) {
        const wasYours = prev.find((r) => r.emoji === emoji)?.owner === 'yours'
        const isYours = reactions.find((r) => r.emoji === emoji)?.owner === 'yours'
        if (wasYours !== isYours) {
          void toggleReactionRemote({ key: id, emoji })
          return
        }
      }
    },

    // ── Resolution ──
    /** Card-level resolve/reopen (conv menu / resolve dialog). Replaces the
     *  whole override — a reply pointer from an earlier `→ msg` is dropped,
     *  matching the previous card behavior. */
    setResolution(id: string, resolved: boolean, resolvedBy?: string, message?: string) {
      m.setResolvedOverrides((prev) => ({ ...prev, [id]: { resolved, resolvedBy, message } }))
      if (hasConvex) void setResolutionRemote({ key: id, resolved, resolutionMessage: message, dropReplyPointer: true })
    },

    /** Thread-panel resolution edit: resolving keeps the reply pointer so the
     *  owning reply card can keep editing it inline; reopening clears all. */
    setThreadResolution(id: string, resolved: boolean, message?: string) {
      m.setResolvedOverrides((prev) => {
        const existing = prev[id]
        if (resolved) {
          return {
            ...prev,
            [id]: { resolved: true, resolvedBy: CURRENT_USER_NAME, message, resolvedByReplyId: existing?.resolvedByReplyId },
          }
        }
        return { ...prev, [id]: { resolved: false } }
      })
      if (hasConvex) void setResolutionRemote({ key: id, resolved, resolutionMessage: resolved ? message : undefined })
    },

    // ── Replies ──
    /** Send a reply; a `→ msg` resolution stamps resolvedByReplyId so the
     *  reply card can surface the resolution inline later. */
    sendReply(messageId: string, payload: SendMessagePayload) {
      const { text, resolution, highlightType, attachments } = payload
      let newReplyId: string | undefined
      if (text || attachments?.length) {
        const now = Date.now()
        newReplyId = `reply_${now}`
        const newReply: ReplyData = {
          id: newReplyId,
          authorName: CURRENT_USER_NAME,
          timestamp: nowTimestamp(now),
          body: text,
          highlightType,
          createdAtMs: now,
          attachments,
        }
        m.setSentReplies((prev) => ({ ...prev, [messageId]: [...(prev[messageId] ?? []), newReply] }))
        if (hasConvex) {
          void sendReplyRemote({
            messageKey: messageId,
            seedKey: newReply.id,
            body: text,
            highlightType,
            attachments,
          })
        }
      }
      if (resolution) {
        m.setResolvedOverrides((prev) => ({
          ...prev,
          [messageId]: {
            resolved: true,
            resolvedBy: CURRENT_USER_NAME,
            message: resolution.message,
            resolvedByReplyId: newReplyId,
          },
        }))
        if (hasConvex) {
          void setResolutionRemote({
            key: messageId,
            resolved: true,
            resolutionMessage: resolution.message,
            resolvedByReplyKey: newReplyId,
          })
        }
      }
    },

    deleteReply(messageId: string, replyId: string) {
      m.setSentReplies((prev) => ({ ...prev, [messageId]: (prev[messageId] ?? []).filter((r) => r.id !== replyId) }))
      if (hasConvex) void removeReplyRemote({ key: replyId })
    },

    // ── Huddles ──
    /** Inline (V1/V3) creation: people + first message. Returns the new id. */
    createHuddle(topicId: string, members: string[], firstMessageText: string): string {
      const newHuddleId = `h_new_${Date.now()}`
      const newHuddle: Huddle = {
        id: newHuddleId,
        topicId,
        members: [CURRENT_USER_NAME, ...members],
        state: 'active',
        lastActivity: 'Today',
        conversation: {
          id: `hc_new_${Date.now()}`,
          authorName: CURRENT_USER_NAME,
          timestamp: nowTimestamp(),
          body: firstMessageText,
        },
      }
      m.setCreatedHuddles((prev) => ({ ...prev, [topicId]: [...(prev[topicId] ?? []), newHuddle] }))
      if (hasConvex && newHuddle.conversation) {
        void createHuddleRemote({
          topicKey: topicId,
          seedKey: newHuddleId,
          memberNames: members,
          firstMessage: { seedKey: newHuddle.conversation.id, body: firstMessageText },
        })
      }
      return newHuddleId
    },

    /** V2 dialog creation: members only, no seed message. Returns the new id. */
    createEmptyHuddle(topicId: string, members: string[]): string {
      const newHuddleId = `h_new_${Date.now()}`
      const newHuddle: Huddle = {
        id: newHuddleId,
        topicId,
        members: [CURRENT_USER_NAME, ...members],
        state: 'active',
        lastActivity: 'Today',
      }
      m.setCreatedHuddles((prev) => ({ ...prev, [topicId]: [...(prev[topicId] ?? []), newHuddle] }))
      if (hasConvex) {
        void createHuddleRemote({ topicKey: topicId, seedKey: newHuddleId, memberNames: members })
      }
      return newHuddleId
    },

    deleteHuddle(huddleId: string) {
      m.setDeletedHuddleIds((prev) => new Set([...prev, huddleId]))
      if (hasConvex) void removeHuddleRemote({ key: huddleId })
    },

    // ── Desk (pages keep their instant local hide; these persist it) ──
    dismissScreenerItem(id: string) {
      if (hasConvex) void dismissScreenerRemote({ id })
    },
    /** "Later" — the item reappears after the default snooze (24h). */
    snoozeScreenerItem(id: string) {
      if (hasConvex) void snoozeScreenerRemote({ id })
    },
    removeOpenWorkItem(id: string) {
      if (hasConvex) void removeOpenWorkRemote({ id })
    },
  }
}
