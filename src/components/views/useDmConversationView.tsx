import { useState, useRef, useEffect, type ReactNode } from 'react'
import { ConversationHeader } from '@/components/ConversationHeader'
import { ConversationCard } from '@/components/ConversationCard'
import { ThreadPanel } from '@/components/ThreadPanel'
import { DateDivider } from '@/components/ui/DateDivider'
import { ComposeBox, type SendPayload } from '@/components/ui/ComposeBox'
import { EmptyState } from '@/components/ui/EmptyState'
import { DM_CONVERSATIONS } from '@/data/dmData'
import { AGENT_DM_CONVERSATIONS } from '@/data/agentData'
import { REPLIES, type ReplyData } from '@/data/replyData'
import { type ConversationData } from '@/data/topicData'
import { PEOPLE } from '@/data/peopleData'
import { useStarred } from '@/lib/starred'
import { useTopicStore } from '@/lib/topicStore'
import { useTopicMutations } from '@/lib/topicMutations'
import { useLastSelection } from '@/lib/lastSelection'
import type { StartTopicResult } from '@/components/CreateTopicDialog'

interface UseDmConversationViewArgs {
  dmId: number | null
  dmName?: string
  /** Override the default toggleDm-and-stay behavior (e.g. Desk wants to clear selection on unstar) */
  onToggleStarred?: () => void
  /** When false, suppress non-urgent hasNewMessage/hasNewReply flags. Urgent flags always show. */
  showUnreads?: boolean
  /** Promote the current DM into the first huddle of a new topic. */
  onStartTopicFromDm?: (dmId: number, dmName: string, seedMessageId: string, data: StartTopicResult) => void
  /** Rendered after the name in the header (e.g. the "Agent" chip on agent DMs). */
  headerBadge?: ReactNode
  /** Group conversations: member count shown as the header badge icon instead of an avatar. */
  headerGroupCount?: number
}

interface ViewSlots {
  rightPanel: ReactNode
  threadPanel: ReactNode | undefined
}

export function useDmConversationView({ dmId, dmName, onToggleStarred, showUnreads = false, onStartTopicFromDm, headerBadge, headerGroupCount }: UseDmConversationViewArgs): ViewSlots {
  const [sentMessages, setSentMessages] = useState<Record<number, ConversationData[]>>({})
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [resolvedOverrides, setResolvedOverrides] = useState<Record<string, { resolved: boolean; resolvedBy?: string; message?: string; resolvedByReplyId?: string }>>({})
  const [threadConvId, setThreadConvId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { isDmStarred, toggleDm } = useStarred()
  const { findAllHuddlesByOriginDm, findTopic } = useTopicStore()
  const { pendingDmThreadId, setPendingDmThreadId } = useLastSelection()
  const {
    // Replies are id-keyed and shared across DM and Huddle entry points so a
    // reply posted from either thread panel shows up on both — below the promotion
    // divider when the message has been promoted to a topic.
    sentReplies,
    setSentReplies,
    bodyOverrides,
    setBodyOverrides,
    highlightOverrides,
    setHighlightOverrides,
    reactionOverrides,
    setReactionOverrides,
    isTopicResolved,
  } = useTopicMutations()

  const dmGroups = dmId != null ? (DM_CONVERSATIONS[dmId] ?? AGENT_DM_CONVERSATIONS[dmId] ?? []) : []
  const currentSent = dmId != null ? (sentMessages[dmId] ?? []) : []

  const dmPartner = dmName ? PEOPLE.find((p) => p.name === dmName) : undefined
  const dmContext = dmPartner ? { participants: [dmPartner] } : undefined

  const makeStartTopicHandler = (seedMessageId: string) =>
    dmId != null && dmName && onStartTopicFromDm
      ? (data: StartTopicResult) => onStartTopicFromDm(dmId, dmName, seedMessageId, data)
      : undefined

  const promotedHuddles = dmId != null ? findAllHuddlesByOriginDm(dmId) : []
  /** Map from seed message id to its huddle context, for rendering the anchor on the right card
   *  AND the inline promotion divider in the thread panel. */
  const huddleContextByMessageId = new Map<string, { topicId: string; topicTitle: string; topicResolved: boolean; promotedAt: string; promotedAtMs?: number }>()
  for (const h of promotedHuddles) {
    if (!h.seedMessageId) continue
    const topic = findTopic(h.topicId)
    if (topic) huddleContextByMessageId.set(h.seedMessageId, {
      topicId: topic.id,
      topicTitle: topic.title,
      topicResolved: isTopicResolved(topic.id),
      promotedAt: h.promotedAt ?? '',
      promotedAtMs: h.promotedAtMs,
    })
  }

  // Auto-open the thread panel when arriving from the huddle's "Open in DMs" button.
  // The topic view stages `pendingDmThreadId` in context just before navigating; we
  // consume it here once the DM is mounted and clear it so back-nav doesn't re-trigger.
  useEffect(() => {
    if (dmId == null || !pendingDmThreadId) return
    setThreadConvId(pendingDmThreadId)
    setPendingDmThreadId(null)
  }, [dmId, pendingDmThreadId, setPendingDmThreadId])

  const allConvs = [...dmGroups.flatMap((g) => g.convs), ...currentSent]
  const threadConvRaw = threadConvId ? allConvs.find((c) => c.id === threadConvId) : null
  // Merge id-keyed body / highlight overrides so the panel reflects edits made from
  // either the DM ConversationCard list or the topic/huddle thread panel.
  const threadConv = threadConvRaw
    ? {
        ...threadConvRaw,
        ...(threadConvRaw.id in bodyOverrides ? { body: bodyOverrides[threadConvRaw.id] } : {}),
        ...(threadConvRaw.id in highlightOverrides ? { highlightType: highlightOverrides[threadConvRaw.id] } : {}),
      }
    : null
  const rawThreadReplies = threadConvId ? (REPLIES[threadConvId] ?? []) : []
  const threadReplies = rawThreadReplies.map((r) => ({
    ...r,
    isNew: r.isNew && (r.isUrgent || showUnreads),
  }))
  const threadSentReplies = threadConvId ? (sentReplies[threadConvId] ?? []) : []

  const isConvResolved = (id: string, initial = false) =>
    resolvedOverrides[id]?.resolved ?? initial
  const getConvResolvedBy = (id: string, initial = '') =>
    resolvedOverrides[id]?.resolvedBy ?? initial
  const getConvResolutionMsg = (id: string, initial = '') =>
    resolvedOverrides[id]?.message ?? initial

  const handleResolvedChange = (id: string, resolved: boolean, resolvedBy?: string, message?: string) =>
    setResolvedOverrides((prev) => ({ ...prev, [id]: { resolved, resolvedBy, message } }))

  const openThread = (convId: string) => setThreadConvId(convId)
  const closeThread = () => setThreadConvId(null)

  const handleSendReply = ({ text, resolution, attachments }: SendPayload) => {
    if (!threadConvId) return
    let newReplyId: string | undefined
    if (text || attachments?.length) {
      const now = Date.now()
      newReplyId = `reply_${now}`
      const newReply: ReplyData = {
        id: newReplyId,
        authorName: 'You',
        timestamp: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        body: text,
        createdAtMs: now,
        attachments,
      }
      setSentReplies((prev) => ({
        ...prev,
        [threadConvId]: [...(prev[threadConvId] ?? []), newReply],
      }))
    }
    if (resolution) {
      // Stamp resolvedByReplyId so editing this reply later can surface the resolution inline.
      setResolvedOverrides((prev) => ({
        ...prev,
        [threadConvId]: { resolved: true, resolvedBy: 'You', message: resolution.message, resolvedByReplyId: newReplyId },
      }))
    }
  }

  const handleDeleteReply = (replyId: string) => {
    if (!threadConvId) return
    setSentReplies((prev) => ({
      ...prev,
      [threadConvId]: (prev[threadConvId] ?? []).filter((r) => r.id !== replyId),
    }))
  }

  const handleSend = ({ text, resolution, attachments }: SendPayload) => {
    if (dmId == null) return
    if (text || attachments?.length) {
      const newMsg: ConversationData = {
        id: `sent_${Date.now()}`,
        authorName: 'You',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        body: text,
        isResolved: resolution ? true : undefined,
        resolvedBy: resolution ? 'You' : undefined,
        resolutionMessage: resolution?.message || undefined,
        attachments,
      }
      setSentMessages((prev) => ({ ...prev, [dmId]: [...(prev[dmId] ?? []), newMsg] }))
    } else if (resolution) {
      setSentMessages((prev) => {
        const msgs = prev[dmId] ?? []
        if (msgs.length === 0) return prev
        const updated = [...msgs]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          isResolved: true,
          resolvedBy: 'You',
          resolutionMessage: resolution.message || undefined,
        }
        return { ...prev, [dmId]: updated }
      })
    }
  }

  const handleDelete = (id: string) => {
    if (dmId == null) return
    setSentMessages((prev) => ({ ...prev, [dmId]: (prev[dmId] ?? []).filter((m) => m.id !== id) }))
    setDeletedIds((prev) => new Set([...prev, id]))
  }

  // Close thread when switching DMs — but skip the initial mount, since we may have
  // just consumed a pendingDmThreadId from the huddle's "Open original" button and
  // setting threadConvId back to null would clobber that.
  const prevDmIdRef = useRef<number | null>(dmId)
  useEffect(() => {
    if (prevDmIdRef.current !== dmId) {
      // genuine DM switch (not initial bind) — close any open thread
      if (prevDmIdRef.current != null) setThreadConvId(null)
      prevDmIdRef.current = dmId
    }
  }, [dmId])

  // Scroll to bottom on DM switch / new message
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [dmId])
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [currentSent.length])

  if (dmId == null || !dmName) {
    return {
      rightPanel: (
        <div className="flex-1 flex items-center justify-center h-full">
          <EmptyState />
        </div>
      ),
      threadPanel: undefined,
    }
  }

  const rightPanel = (
    <div className="flex flex-col h-full">
      <ConversationHeader
        name={dmName}
        badge={headerBadge}
        groupCount={headerGroupCount}
        isStarred={dmId != null && isDmStarred(dmId)}
        onToggleStarred={
          onToggleStarred ??
          (dmId != null && dmName ? () => toggleDm({ dmId, name: dmName }) : undefined)
        }
      />
      <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col">
        <div className="flex-1 min-h-0" />
        <div className="shrink-0 flex flex-col px-4 py-4 gap-2">
          {dmGroups.map((group) => (
            <div key={group.dateLabel} className="flex flex-col gap-2">
              <DateDivider label={group.dateLabel} className="sticky top-0 z-10 bg-bg-surface" />
              {group.convs.filter((c) => !deletedIds.has(c.id)).map((c) => (
                <ConversationCard
                  key={`${dmId}_${c.id}`}
                  authorName={c.authorName}
                  timestamp={c.timestamp}
                  body={bodyOverrides[c.id] ?? c.body}
                  attachments={c.attachments}
                  reactions={reactionOverrides[c.id] ?? c.reactions}
                  highlightType={c.id in highlightOverrides ? highlightOverrides[c.id] : c.highlightType}
                  replyCount={(REPLIES[c.id]?.length ?? c.replyCount ?? 0) + (sentReplies[c.id]?.length ?? 0)}
                  hasNewMessage={c.hasNewMessage && (c.isUrgent || showUnreads)}
                  hasNewReply={c.hasNewReply && (c.isUrgent || showUnreads)}
                  isUrgent={c.isUrgent}
                  isResolved={isConvResolved(c.id, c.isResolved)}
                  resolvedBy={getConvResolvedBy(c.id, c.resolvedBy)}
                  resolutionMessage={getConvResolutionMsg(c.id, c.resolutionMessage)}
                  isSelected={threadConvId === c.id}
                  showCreateTopic={!huddleContextByMessageId.has(c.id)}
                  dmContext={dmContext}
                  huddleContext={huddleContextByMessageId.get(c.id)}
                  onStartTopicFromDm={makeStartTopicHandler(c.id)}
                  onResolvedChange={(resolved, resolvedBy, message) => handleResolvedChange(c.id, resolved, resolved ? (resolvedBy ?? 'You') : undefined, message)}
                  onReactionsChange={(next) => setReactionOverrides((prev) => ({ ...prev, [c.id]: next }))}
                  onBodyChange={(b) => setBodyOverrides((prev) => ({ ...prev, [c.id]: b }))}
                  onHighlightChange={(hl) => setHighlightOverrides((prev) => ({ ...prev, [c.id]: hl }))}
                  onClick={() => openThread(c.id)}
                  onReply={() => openThread(c.id)}
                  onDelete={() => handleDelete(c.id)}
                />
              ))}
            </div>
          ))}

          {currentSent.length > 0 && (
            <div className="flex flex-col gap-2">
              <DateDivider label="Today" className="sticky top-0 z-10 bg-bg-surface" />
              {currentSent.map((m) => (
                <ConversationCard
                  key={m.id}
                  authorName={m.authorName}
                  timestamp={m.timestamp}
                  body={bodyOverrides[m.id] ?? m.body}
                  attachments={m.attachments}
                  reactions={reactionOverrides[m.id] ?? m.reactions}
                  highlightType={m.id in highlightOverrides ? highlightOverrides[m.id] : m.highlightType}
                  replyCount={sentReplies[m.id]?.length ?? 0}
                  isResolved={isConvResolved(m.id, m.isResolved)}
                  resolvedBy={getConvResolvedBy(m.id, m.resolvedBy)}
                  resolutionMessage={getConvResolutionMsg(m.id, m.resolutionMessage)}
                  isSelected={threadConvId === m.id}
                  showCreateTopic={!huddleContextByMessageId.has(m.id)}
                  dmContext={dmContext}
                  huddleContext={huddleContextByMessageId.get(m.id)}
                  onStartTopicFromDm={makeStartTopicHandler(m.id)}
                  onResolvedChange={(resolved, resolvedBy, message) => handleResolvedChange(m.id, resolved, resolved ? (resolvedBy ?? 'You') : undefined, message)}
                  onReactionsChange={(next) => setReactionOverrides((prev) => ({ ...prev, [m.id]: next }))}
                  onBodyChange={(b) => setBodyOverrides((prev) => ({ ...prev, [m.id]: b }))}
                  onHighlightChange={(hl) => setHighlightOverrides((prev) => ({ ...prev, [m.id]: hl }))}
                  onClick={() => openThread(m.id)}
                  onReply={() => openThread(m.id)}
                  onDelete={() => handleDelete(m.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="p-3">
        <ComposeBox onSend={handleSend} contextLabel={dmName ? `DM · ${dmName}` : undefined} />
      </div>
    </div>
  )

  const threadPromotion = threadConvId ? huddleContextByMessageId.get(threadConvId) : undefined

  const threadPanel = threadConv ? (
    <ThreadPanel
      conversation={threadConv}
      replies={threadReplies}
      sentReplies={threadSentReplies}
      isResolved={isConvResolved(threadConv.id, threadConv.isResolved)}
      dmMembers={dmName ? ['You', dmName] : []}
      replyBodyOverrides={bodyOverrides}
      replyHighlightOverrides={highlightOverrides}
      replyReactionOverrides={reactionOverrides}
      initialReactions={threadConvId ? reactionOverrides[threadConvId] ?? threadConv.reactions : threadConv.reactions}
      onInitialReactionsChange={
        threadConvId
          ? (next) => setReactionOverrides((prev) => ({ ...prev, [threadConvId]: next }))
          : undefined
      }
      initialHighlightType={threadConv.highlightType}
      onInitialHighlightChange={
        threadConvId
          ? (hl) => setHighlightOverrides((prev) => ({ ...prev, [threadConvId]: hl }))
          : undefined
      }
      resolvedByReplyId={threadConvId ? resolvedOverrides[threadConvId]?.resolvedByReplyId : undefined}
      resolutionMsg={threadConvId ? resolvedOverrides[threadConvId]?.message : undefined}
      onResolutionChange={
        threadConvId
          ? (resolved, message) => setResolvedOverrides((prev) => {
              const existing = prev[threadConvId]
              if (resolved) {
                return { ...prev, [threadConvId]: { resolved: true, resolvedBy: 'You', message, resolvedByReplyId: existing?.resolvedByReplyId } }
              }
              return { ...prev, [threadConvId]: { resolved: false } }
            })
          : undefined
      }
      promotionDivider={
        threadPromotion
          ? {
              topicId: threadPromotion.topicId,
              topicTitle: threadPromotion.topicTitle,
              topicResolved: threadPromotion.topicResolved,
              dateLabel: threadPromotion.promotedAt,
              promotedAtMs: threadPromotion.promotedAtMs,
            }
          : undefined
      }
      onClose={closeThread}
      onSendReply={handleSendReply}
      onDeleteReply={handleDeleteReply}
      onReplyBodyChange={(replyId, body) => setBodyOverrides((prev) => ({ ...prev, [replyId]: body }))}
      onReplyHighlightChange={(replyId, hl) => setHighlightOverrides((prev) => ({ ...prev, [replyId]: hl }))}
      onReplyReactionsChange={(replyId, next) => setReactionOverrides((prev) => ({ ...prev, [replyId]: next }))}
    />
  ) : undefined

  return { rightPanel, threadPanel }
}
