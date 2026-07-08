import { useState, useRef, useEffect, type ReactNode } from 'react'
import { IconPlus, IconX, IconPencilMinus } from '@tabler/icons-react'
import { ConversationHeader } from '@/components/ConversationHeader'
import { ConversationCard } from '@/components/ConversationCard'
import { ThreadPanel } from '@/components/ThreadPanel'
import { HuddleCard } from '@/components/HuddleCard'
import { StartHuddleDialog, type StartHuddleResult } from '@/components/StartHuddleDialog'
import { DateDivider } from '@/components/ui/DateDivider'
import { ComposeBox, type SendPayload } from '@/components/ui/ComposeBox'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { TopicTabs, type TopicTab } from '@/components/ui/TopicTabs'
import { IconButton } from '@/components/ui/IconButton'
import { Button } from '@/components/ui/Button'
import { TimelineView } from '@/components/TimelineView'
import { TOPIC_TIMELINES } from '@/data/timelineData'
import { TOPIC_CONVERSATIONS, type ConversationData, type HighlightType, type ReactionData } from '@/data/topicData'
import { DM_CONVERSATIONS } from '@/data/dmData'
import { type Huddle } from '@/data/huddleData'
import { PEOPLE } from '@/data/peopleData'
import { REPLIES, type ReplyData } from '@/data/replyData'
import { useStarred } from '@/lib/starred'
import { useTopicStore } from '@/lib/topicStore'
import { useTopicMutations } from '@/lib/topicMutations'
import { useLastSelection } from '@/lib/lastSelection'
import { useDebug } from '@/lib/debug'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface UseTopicViewArgs {
  topicId: string | null
  topicTitle?: string
  /** Override the default toggleTopic-and-stay behavior (e.g. Desk wants to clear selection on unstar) */
  onToggleStarred?: () => void
  /** When false, suppress non-urgent hasNewMessage/hasNewReply flags. Urgent flags always show. */
  showUnreads?: boolean
  /** V2 sidebar tree: when set, auto-opens the matching huddle's thread panel. */
  selectedHuddleId?: string | null
}

interface ViewSlots {
  rightPanel: ReactNode
  threadPanel: ReactNode | undefined
}

export function useTopicView({
  topicId,
  topicTitle,
  onToggleStarred,
  showUnreads = false,
  selectedHuddleId: externalSelectedHuddleId = null,
}: UseTopicViewArgs): ViewSlots {
  const [activeTab, setActiveTab] = useState<TopicTab>('conversations')
  const scrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { setPendingDmThreadId, pendingTopicThread, setPendingTopicThread } = useLastSelection()
  const { isTopicStarred, toggleTopic } = useStarred()
  const { getHuddlesForTopic, findTopic } = useTopicStore()
  const { state: debug } = useDebug()
  const huddleVariant = debug.huddles.variant
  const topic = topicId != null ? findTopic(topicId) : undefined

  // Mutation state lives at the app level so a topic's runtime data (sent
  // messages, replies, resolutions, etc.) survives navigating away and back.
  const {
    sentMessages,
    setSentMessages,
    deletedIds,
    setDeletedIds,
    resolvedOverrides,
    setResolvedOverrides,
    sentReplies,
    setSentReplies,
    bodyOverrides,
    setBodyOverrides,
    highlightOverrides,
    setHighlightOverrides,
    createdHuddles,
    setCreatedHuddles,
    deletedHuddleIds,
    setDeletedHuddleIds,
    huddleBodyOverrides,
    setHuddleBodyOverrides,
    huddleSentMessages,
    setHuddleSentMessages,
    reactionOverrides,
    setReactionOverrides,
    isTopicResolved,
  } = useTopicMutations()

  // Derived: a topic is "resolved" iff every non-deleted conv in it is resolved.
  // Single source of truth for the dashed-circle vs checkmark icon everywhere.
  const topicResolved = topicId != null ? isTopicResolved(topicId) : false

  const handleReactionsChange = (id: string, next: ReactionData[]) =>
    setReactionOverrides((prev) => ({ ...prev, [id]: next }))

  // Thread + huddle UI state stays local — it's transient view state, not data.
  const [threadConvId, setThreadConvId] = useState<string | null>(null)
  // Intelligence prototype: the topic timeline replaces the conversation body
  // (V2/V3 header button; V1 uses its Timeline tab instead).
  const [showTimeline, setShowTimeline] = useState(false)
  const huddleCreateRef = useRef<HTMLDivElement>(null)
  const huddleToInputRef = useRef<HTMLInputElement>(null)
  const [selectedHuddleId, setSelectedHuddleId] = useState<string | null>(null)
  const [isCreatingHuddle, setIsCreatingHuddle] = useState(false)
  const [huddleRecipients, setHuddleRecipients] = useState<string[]>([])
  const [huddleToQuery, setHuddleToQuery] = useState('')
  const [huddleToFocused, setHuddleToFocused] = useState(false)
  const [huddleSuggestionIndex, setHuddleSuggestionIndex] = useState(0)

  const currentGroups = topicId != null ? (TOPIC_CONVERSATIONS[topicId] ?? []) : []
  const currentSent = topicId != null ? (sentMessages[topicId] ?? []) : []
  const currentHuddles = topicId != null
    ? [...getHuddlesForTopic(topicId), ...(createdHuddles[topicId] ?? [])]
        .filter((h) => !deletedHuddleIds.has(h.id))
        .map((h) => {
          if (!h.conversation) return h
          const override = huddleBodyOverrides[h.conversation.id]
          if (override) return { ...h, conversation: { ...h.conversation, body: override } }
          return h
        })
    : []

  /** When the topic was promoted from a DM, this is the seed huddle. Drives the DM-origin empty state. */
  const originHuddle = currentHuddles.find((h) => h.originDmId !== undefined)
  const hasAnyPublicMessages =
    currentGroups.some((g) => g.convs.some((c) => !deletedIds.has(c.id))) || currentSent.length > 0

  /** V2 huddle main-view: when set, the rightPanel renders the huddle's content
   *  (header in huddleMode, body of extraConvs) instead of the topic's content.
   *  Derived directly from the URL-driven externalSelectedHuddleId — using local
   *  selectedHuddleId here would cause a one-render flicker between URL change
   *  and the sync effect committing it to local state. */
  const v2SelectedHuddle =
    huddleVariant === 2 && externalSelectedHuddleId
      ? currentHuddles.find((h) => h.id === externalSelectedHuddleId)
      : undefined
  const isV2HuddleView = v2SelectedHuddle != null
  const v2HuddleNameLabel = v2SelectedHuddle
    ? (() => {
        const others = v2SelectedHuddle.members.filter((n) => n !== 'You')
        return others.length > 0 ? others.join(', ') : v2SelectedHuddle.members.join(', ')
      })()
    : ''

  const allCurrentConvs = [
    ...currentGroups.flatMap((g) => g.convs).filter((c) => !deletedIds.has(c.id)),
    ...currentSent,
  ]
  // Includes seed conv + extraConvs + runtime huddleSentMessages across all huddles
  // in this topic, so clicking any huddle conv card can resolve via this lookup pool.
  // Empty huddles (no seed conversation) contribute only their extras.
  const allHuddleConvs: ConversationData[] = currentHuddles.flatMap((h) => [
    ...(h.conversation ? [h.conversation] : []),
    ...(h.extraConvs ?? []),
    ...(huddleSentMessages[h.id] ?? []),
  ])

  /** When the open thread is a promoted huddle's seed message, find that huddle so we can
   *  source the seed message from DM_CONVERSATIONS and render the promotion divider + button. */
  const promotedHuddleForThread = threadConvId
    ? currentHuddles.find((h) => h.seedMessageId === threadConvId && h.originDmId !== undefined)
    : undefined

  /** Look up the seed message from DM_CONVERSATIONS when threadConvId points there. */
  const dmSeedConv: ConversationData | undefined = (() => {
    if (!promotedHuddleForThread || promotedHuddleForThread.originDmId === undefined) return undefined
    const groups = DM_CONVERSATIONS[promotedHuddleForThread.originDmId]
    if (!groups) return undefined
    for (const g of groups) {
      const found = g.convs.find((c) => c.id === threadConvId)
      if (found) return found
    }
    return undefined
  })()

  const threadConvRaw = threadConvId
    ? allCurrentConvs.find((c) => c.id === threadConvId)
      ?? allHuddleConvs.find((c) => c.id === threadConvId)
      ?? dmSeedConv
    : null
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

  /** Open a regular (non-huddle) thread. Clears any previously-selected huddle so
   *  the ThreadPanel doesn't keep showing huddle members/lock when the user clicks
   *  from a HuddleCard to a ConversationCard in V3's mixed stream. Huddle clicks
   *  use a separate `openHuddle` handler that sets selectedHuddleId directly. */
  const openThread = (convId: string) => {
    setSelectedHuddleId(null)
    setThreadConvId(convId)
  }
  const closeThread = () => {
    setThreadConvId(null)
    setSelectedHuddleId(null)
  }

  // Leave the timeline when switching topics or huddle variants.
  useEffect(() => {
    setShowTimeline(false)
  }, [topicId, huddleVariant])

  // One-shot deep link (launcher search results, fact-check "view source"):
  // open the requested thread once this topic is showing, then clear.
  useEffect(() => {
    if (pendingTopicThread && topicId != null && pendingTopicThread.topicId === topicId) {
      setShowTimeline(false)
      setActiveTab('conversations')
      setSelectedHuddleId(null)
      setThreadConvId(pendingTopicThread.convId)
      setPendingTopicThread(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTopicThread, topicId])

  const isConvResolved = (id: string, initial = false) => resolvedOverrides[id]?.resolved ?? initial
  const getConvResolvedBy = (id: string, initial = '') => resolvedOverrides[id]?.resolvedBy ?? initial
  const getConvResolutionMsg = (id: string, initial = '') => resolvedOverrides[id]?.message ?? initial

  const openCount     = allCurrentConvs.filter((c) => !isConvResolved(c.id, c.isResolved)).length
  const resolvedCount = allCurrentConvs.filter((c) =>  isConvResolved(c.id, c.isResolved)).length

  // Topic members = invitees (added when topic was created) ∪ authors who have posted (top-level + replies).
  const replyAuthors = allCurrentConvs.flatMap((c) => (REPLIES[c.id] ?? []).map((r) => r.authorName))
  const topicMembers = Array.from(new Set([
    ...(topic?.invitees ?? []),
    ...allCurrentConvs.map((c) => c.authorName),
    ...replyAuthors,
  ]))

  const handleResolvedChange = (id: string, resolved: boolean, resolvedBy?: string, message?: string) =>
    setResolvedOverrides((prev) => ({ ...prev, [id]: { resolved, resolvedBy, message } }))
  const handleHighlightChange = (id: string, hl: HighlightType | undefined) =>
    setHighlightOverrides((prev) => ({ ...prev, [id]: hl }))
  const handleBodyChange = (id: string, body: string) =>
    setBodyOverrides((prev) => ({ ...prev, [id]: body }))

  const handleSendReply = ({ text, resolution, highlightType, attachments }: SendPayload) => {
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
        highlightType,
        createdAtMs: now,
        attachments,
      }
      setSentReplies((prev) => ({ ...prev, [threadConvId]: [...(prev[threadConvId] ?? []), newReply] }))
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
    setSentReplies((prev) => ({ ...prev, [threadConvId]: (prev[threadConvId] ?? []).filter((r) => r.id !== replyId) }))
  }

  const handleSend = ({ text, resolution, highlightType, attachments }: SendPayload) => {
    if (topicId == null) return
    if (text || attachments?.length) {
      const newMsg: ConversationData = {
        id: `sent_${Date.now()}`,
        authorName: 'You',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        body: text,
        highlightType,
        isResolved: resolution ? true : undefined,
        resolvedBy: resolution ? 'You' : undefined,
        resolutionMessage: resolution?.message || undefined,
        attachments,
      }
      setSentMessages((prev) => ({ ...prev, [topicId]: [...(prev[topicId] ?? []), newMsg] }))
    } else if (resolution) {
      setSentMessages((prev) => {
        const msgs = prev[topicId] ?? []
        if (msgs.length === 0) return prev
        const updated = [...msgs]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          isResolved: true,
          resolvedBy: 'You',
          resolutionMessage: resolution.message || undefined,
        }
        return { ...prev, [topicId]: updated }
      })
    }
  }

  const handleDelete = (id: string) => {
    if (topicId == null) return
    setSentMessages((prev) => ({ ...prev, [topicId]: (prev[topicId] ?? []).filter((m) => m.id !== id) }))
    setDeletedIds((prev) => new Set([...prev, id]))
  }

  const cancelHuddleCreation = () => {
    setIsCreatingHuddle(false)
    setHuddleRecipients([])
    setHuddleToQuery('')
  }

  // Backup refocus: any time the recipient list changes while the creator is open,
  // ensure the To: input keeps the cursor so the user can keep typing more people
  // without re-clicking the field. Defers a tick so React commits first.
  useEffect(() => {
    if (!isCreatingHuddle) return
    const t = setTimeout(() => huddleToInputRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [isCreatingHuddle, huddleRecipients.length])

  // Close inline huddle creation on outside click or Escape. V2 uses a portalled
  // dialog with its own backdrop, so this effect is skipped there.
  useEffect(() => {
    if (!isCreatingHuddle || huddleVariant === 2) return
    const handleClick = (e: MouseEvent) => {
      if (huddleCreateRef.current?.contains(e.target as Node)) return
      cancelHuddleCreation()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelHuddleCreation()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isCreatingHuddle, huddleVariant])

  /** V2 huddle main-view compose box: writes a top-level message into the selected huddle. */
  const handleHuddleMessageSend = ({ text }: SendPayload) => {
    if (!text || !v2SelectedHuddle) return
    const now = Date.now()
    const newMsg: ConversationData = {
      id: `hsent_${now}`,
      authorName: 'You',
      timestamp: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      body: text,
    }
    setHuddleSentMessages((prev) => ({
      ...prev,
      [v2SelectedHuddle.id]: [...(prev[v2SelectedHuddle.id] ?? []), newMsg],
    }))
  }

  const handleHuddleSend = ({ text }: SendPayload) => {
    if (!text || huddleRecipients.length === 0 || topicId == null) return
    const newHuddleId = `h_new_${Date.now()}`
    const newHuddle: Huddle = {
      id: newHuddleId,
      topicId,
      members: ['You', ...huddleRecipients],
      state: 'active',
      lastActivity: 'Today',
      conversation: {
        id: `hc_new_${Date.now()}`,
        authorName: 'You',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        body: text,
      },
    }
    setCreatedHuddles((prev) => ({ ...prev, [topicId]: [...(prev[topicId] ?? []), newHuddle] }))
    cancelHuddleCreation()
  }

  /** V2 dialog flow: members-only creation. The new huddle has no seed message —
   *  the user lands inside it and writes their first via the huddle's compose box. */
  const handleStartHuddleFromDialog = ({ invitees }: StartHuddleResult) => {
    if (topicId == null || invitees.length === 0) return
    const newHuddleId = `h_new_${Date.now()}`
    const newHuddle: Huddle = {
      id: newHuddleId,
      topicId,
      members: ['You', ...invitees.map((p) => p.name)],
      state: 'active',
      lastActivity: 'Today',
      // No conversation set — empty huddle.
    }
    setCreatedHuddles((prev) => ({ ...prev, [topicId]: [...(prev[topicId] ?? []), newHuddle] }))
    setIsCreatingHuddle(false)
    navigate(`/topics/${topicId}?huddle=${newHuddleId}`)
  }

  const handleDeleteHuddle = (huddleId: string) => {
    setDeletedHuddleIds((prev) => new Set([...prev, huddleId]))
    if (selectedHuddleId === huddleId) {
      setSelectedHuddleId(null)
      setThreadConvId(null)
    }
  }

  const addRecipient = (name: string) => {
    if (!huddleRecipients.includes(name)) setHuddleRecipients((prev) => [...prev, name])
    setHuddleToQuery('')
    setHuddleSuggestionIndex(0)
    // Re-focus the To: input so the user can keep typing more people without re-clicking.
    // Defer to next tick so React commits the state changes first.
    setTimeout(() => huddleToInputRef.current?.focus(), 0)
  }
  const removeRecipient = (name: string) => setHuddleRecipients((prev) => prev.filter((n) => n !== name))

  const toSuggestions = PEOPLE.filter(
    (p) => !huddleRecipients.includes(p.name) && p.name.toLowerCase().includes(huddleToQuery.toLowerCase())
  )

  // Reset state when switching topics
  useEffect(() => {
    setThreadConvId(null)
    setActiveTab('conversations')
    setSelectedHuddleId(null)
    cancelHuddleCreation()
  }, [topicId])

  // V2 sidebar tree: when the URL-driven huddle changes, close any open thread so
  // a stale thread from the previous huddle doesn't briefly render against the new
  // huddle's body. v2SelectedHuddle is derived directly from the URL — no local-state
  // sync needed (which previously caused a one-render flicker).
  useEffect(() => {
    if (huddleVariant !== 2) return
    setThreadConvId(null)
  }, [huddleVariant, externalSelectedHuddleId])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [topicId])
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [currentSent.length])

  if (topicId == null || !topicTitle) {
    return {
      rightPanel: (
        <div className="flex-1 flex items-center justify-center h-full">
          <EmptyState />
        </div>
      ),
      threadPanel: undefined,
    }
  }

  /** People-picker + first-message create UI. Identical markup whether mounted in
   *  V1 (Huddles tab) or V3 (above the topic compose box) — same border treatment
   *  in both, matching V1's default. */
  const huddleCreatorBlock = (
    <div ref={huddleCreateRef} className="shrink-0 px-3 pb-3 flex flex-col gap-0">
      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-2 bg-bg-elevated border border-border-default rounded-t-lg">
          <span className="text-caption text-text-muted shrink-0">To:</span>
          <div className="flex-1 flex items-center gap-1 flex-wrap min-h-[24px]">
            {huddleRecipients.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-accent-muted text-text-primary text-sm rounded-sm"
              >
                {name}
                <button
                  onClick={() => removeRecipient(name)}
                  className="text-text-muted hover:text-text-primary cursor-pointer"
                >
                  <IconX size={12} stroke={1.5} />
                </button>
              </span>
            ))}
            <input
              ref={huddleToInputRef}
              type="text"
              value={huddleToQuery}
              onChange={(e) => {
                setHuddleToQuery(e.target.value)
                // Reset highlight when the query changes — list contents are now different.
                setHuddleSuggestionIndex(0)
              }}
              onFocus={() => setHuddleToFocused(true)}
              onBlur={() => setTimeout(() => {
                // Only mark unfocused if the input genuinely lost focus. Without
                // this guard, briefly stealing focus on click + immediately refocusing
                // would still trigger setFocused(false) 150ms later, closing the dropdown.
                if (document.activeElement !== huddleToInputRef.current) {
                  setHuddleToFocused(false)
                }
              }, 150)}
              onKeyDown={(e) => {
                if (toSuggestions.length === 0) return
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setHuddleSuggestionIndex((i) => (i + 1) % toSuggestions.length)
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setHuddleSuggestionIndex((i) => (i - 1 + toSuggestions.length) % toSuggestions.length)
                } else if (e.key === 'Enter') {
                  const pick = toSuggestions[huddleSuggestionIndex]
                  if (pick) {
                    e.preventDefault()
                    addRecipient(pick.name)
                  }
                }
              }}
              placeholder={huddleRecipients.length === 0 ? 'Add people...' : 'Add more...'}
              autoFocus
              className="flex-1 min-w-[80px] bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
            />
          </div>
          <button
            onClick={cancelHuddleCreation}
            className="flex items-center gap-1.5 text-caption text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            Cancel
            <kbd className="inline-flex items-center justify-center bg-bg-inset border border-border-strong rounded-sm px-1 py-[1px] text-caption text-text-secondary shrink-0">
              ESC
            </kbd>
          </button>
        </div>
        {huddleToFocused && toSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 bottom-full mb-1 bg-bg-elevated border border-border-default rounded-lg shadow-md py-1 max-h-[200px] overflow-y-auto z-50">
            {toSuggestions.map((person, i) => {
              const isActive = i === huddleSuggestionIndex
              return (
                <button
                  key={person.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHuddleSuggestionIndex(i)}
                  onClick={() => addRecipient(person.name)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 transition-colors cursor-pointer',
                    isActive ? 'bg-bg-hover' : 'hover:bg-bg-hover'
                  )}
                >
                  <Avatar size={24} name={person.name} alt={person.name} />
                  <div className="flex flex-col items-start">
                    <span className="text-sm text-text-primary">{person.name}</span>
                    <span className="text-caption text-text-muted">{person.role}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
      {huddleRecipients.length === 0 ? (
        // Mirror ComposeBox's outer dimensions (p-3 + min-h-[20px] editor row + gap-4 +
        // h-6 button row) so the section height is identical before and after the first
        // recipient is added — guarantees no jump. The hint text uses V1's caption
        // text-muted styling rather than the editor's body text.
        <div className="border border-t-0 border-border-default rounded-b-lg overflow-hidden">
          <div className="bg-bg-inset border border-border-default rounded-lg p-3 flex flex-col gap-4">
            <div className="min-h-[20px] flex items-center text-caption text-text-muted">
              Add at least one person to start a Huddle
            </div>
            <div className="h-6" />
          </div>
        </div>
      ) : (
        <div className="border border-t-0 border-border-default rounded-b-lg overflow-hidden">
          <ComposeBox onSend={handleHuddleSend} placeholder="default" contextLabel={topicTitle ? `New huddle in ${topicTitle}` : undefined} />
        </div>
      )}
    </div>
  )

  const rightPanel = (
    <div className="flex flex-col h-full">
      <ConversationHeader
        name={isV2HuddleView ? v2HuddleNameLabel : topicTitle}
        topicMode={!isV2HuddleView}
        huddleMode={isV2HuddleView}
        isResolved={topicResolved}
        openCount={openCount}
        resolvedCount={resolvedCount}
        members={isV2HuddleView ? v2SelectedHuddle.members : topicMembers}
        hideTopicMeta={huddleVariant === 1 && activeTab === 'huddles'}
        isStarred={topicId != null && isTopicStarred(topicId)}
        onToggleStarred={
          onToggleStarred ??
          (topicId != null && topicTitle
            ? () => toggleTopic({
                topicId,
                title: topicTitle,
                topicStatus: topicResolved ? 'resolved' : 'unresolved',
              })
            : undefined)
        }
        onStartHuddle={
          huddleVariant === 1 || isV2HuddleView ? undefined : () => setIsCreatingHuddle(true)
        }
        onToggleTimeline={
          debug.intelligence.enabled && huddleVariant !== 1 && !isV2HuddleView && topicId != null && TOPIC_TIMELINES[topicId]
            ? () => {
                setThreadConvId(null)
                setShowTimeline((v) => !v)
              }
            : undefined
        }
        timelineActive={showTimeline}
        tabs={
          huddleVariant === 1 ? (
            <TopicTabs
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab)
                setThreadConvId(null)
                setSelectedHuddleId(null)
                cancelHuddleCreation()
              }}
            />
          ) : undefined
        }
      />

      {/* V2 huddle main view — replaces the topic body when a huddle is selected via the sidebar tree.
          Body shows huddle.conversation (seed; for DM-promoted huddles this is the original DM message)
          followed by extraConvs and any huddleSentMessages posted by the user. */}
      {isV2HuddleView && (() => {
        // Empty huddles (no seed) just show extras + runtime messages, or nothing.
        const huddleConvs: ConversationData[] = [
          ...(v2SelectedHuddle.conversation ? [v2SelectedHuddle.conversation] : []),
          ...(v2SelectedHuddle.extraConvs ?? []),
          ...(huddleSentMessages[v2SelectedHuddle.id] ?? []),
        ]
        return (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col">
              <div className="flex-1 min-h-0" />
              <div className="shrink-0 flex flex-col px-4 py-4 gap-2">
                {huddleConvs.length === 0 ? (
                  <div className="py-6 flex items-center justify-center">
                    <span className="text-caption text-text-muted">No messages yet — start the conversation below.</span>
                  </div>
                ) : (
                <div className="flex flex-col gap-2">
                  <DateDivider label={v2SelectedHuddle.lastActivity} className="sticky top-0 z-10 bg-bg-surface" />
                  {huddleConvs.map((c) => (
                    <ConversationCard
                      key={`${v2SelectedHuddle.id}_${c.id}`}
                      authorName={c.authorName}
                      timestamp={c.timestamp}
                      body={bodyOverrides[c.id] ?? c.body}
                        attachments={c.attachments}
                      reactions={reactionOverrides[c.id] ?? c.reactions}
                      highlightType={c.id in highlightOverrides ? highlightOverrides[c.id] : c.highlightType}
                      replyCount={(REPLIES[c.id]?.length ?? c.replyCount ?? 0) + (sentReplies[c.id]?.length ?? 0)}
                      isResolved={isConvResolved(c.id, c.isResolved)}
                      resolvedBy={getConvResolvedBy(c.id, c.resolvedBy)}
                      resolutionMessage={getConvResolutionMsg(c.id, c.resolutionMessage)}
                      showCreateTopic={false}
                      isSelected={threadConvId === c.id}
                      onResolvedChange={(resolved, resolvedBy, message) => handleResolvedChange(c.id, resolved, resolved ? (resolvedBy ?? 'You') : undefined, message)}
                      onReactionsChange={(next) => handleReactionsChange(c.id, next)}
                      onHighlightChange={(hl) => handleHighlightChange(c.id, hl)}
                      onBodyChange={(b) => handleBodyChange(c.id, b)}
                      onClick={() => openThread(c.id)}
                      onReply={() => openThread(c.id)}
                    />
                  ))}
                </div>
                )}
              </div>
            </div>
            <div className="p-3">
              <ComposeBox onSend={handleHuddleMessageSend} contextLabel={`Huddle · ${v2HuddleNameLabel}`} />
            </div>
          </>
        )
      })()}

      {/* Conversations tab — also the only body in V2/V3 (no tabs). Suppressed when a V2 huddle is open. */}
      {/* Topic timeline (Intelligence prototype, V2/V3) - replaces the conversation body. */}
      {showTimeline && !isV2HuddleView && huddleVariant !== 1 && topicId != null && (
        <TimelineView
          topicId={topicId}
          onEntryClick={(entry) => {
            setShowTimeline(false)
            openThread(entry.anchorConvId)
          }}
        />
      )}

      {!showTimeline && !isV2HuddleView && (huddleVariant !== 1 || activeTab === 'conversations') && (() => {
        // V3 unified stream: build date-keyed groups containing both convs and huddles
        // (only "your" huddles, only ones with a conversation seed). Existing V1/V2
        // rendering preserved unchanged below.
        type V3Group = { dateLabel: string; convs: ConversationData[]; sent: ConversationData[]; huddles: Huddle[] }
        const v3Groups: V3Group[] = []
        if (huddleVariant === 3) {
          const map = new Map<string, V3Group>()
          for (const group of currentGroups) {
            const filtered = group.convs.filter((c) => !deletedIds.has(c.id))
            if (filtered.length === 0) continue
            map.set(group.dateLabel, { dateLabel: group.dateLabel, convs: filtered, sent: [], huddles: [] })
          }
          // Member-of huddles with a seed; empty huddles can't exist in V3 anyway.
          const v3Huddles = currentHuddles.filter(
            (h) => h.conversation != null && h.members.includes('You')
          )
          for (const h of v3Huddles) {
            const date = h.lastActivity
            const existing = map.get(date)
            if (existing) existing.huddles.push(h)
            else map.set(date, { dateLabel: date, convs: [], sent: [], huddles: [h] })
          }
          // Sent messages always live under "Today".
          if (currentSent.length > 0) {
            const todayLabel = 'Today'
            const existing = map.get(todayLabel)
            if (existing) existing.sent.push(...currentSent)
            else map.set(todayLabel, { dateLabel: todayLabel, convs: [], sent: [...currentSent], huddles: [] })
          }
          v3Groups.push(...map.values())
        }
        return (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col">
            <div className="flex-1 min-h-0" />
            <div className="shrink-0 flex flex-col px-4 py-4 gap-2">
              {huddleVariant === 3 ? (
                v3Groups.map((group) => (
                  <div key={group.dateLabel} className="flex flex-col gap-2">
                    <DateDivider label={group.dateLabel} className="sticky top-0 z-10 bg-bg-surface" />
                    {group.convs.map((c) => (
                      <ConversationCard
                        key={`${topicId}_${c.id}`}
                        authorName={c.authorName}
                        timestamp={c.timestamp}
                        body={bodyOverrides[c.id] ?? c.body}
                        attachments={c.attachments}
                        reactions={reactionOverrides[c.id] ?? c.reactions}
                        highlightType={c.id in highlightOverrides ? highlightOverrides[c.id] : c.highlightType}
                        replyCount={(REPLIES[c.id]?.length ?? c.replyCount ?? 0) + (sentReplies[c.id]?.length ?? 0)}
                        hasNewMessage={c.hasNewMessage && (c.isUrgent || showUnreads)}
                        hasNewReply={c.hasNewReply && (c.isUrgent || showUnreads)}
                        isResolved={isConvResolved(c.id, c.isResolved)}
                        resolvedBy={getConvResolvedBy(c.id, c.resolvedBy)}
                        resolutionMessage={getConvResolutionMsg(c.id, c.resolutionMessage)}
                        showCreateTopic={false}
                        isSelected={threadConvId === c.id}
                        onResolvedChange={(resolved, resolvedBy, message) => handleResolvedChange(c.id, resolved, resolved ? (resolvedBy ?? 'You') : undefined, message)}
                        onReactionsChange={(next) => handleReactionsChange(c.id, next)}
                        onHighlightChange={(hl) => handleHighlightChange(c.id, hl)}
                        onBodyChange={(b) => handleBodyChange(c.id, b)}
                        onClick={() => openThread(c.id)}
                        onReply={() => openThread(c.id)}
                        onDelete={() => handleDelete(c.id)}
                      />
                    ))}
                    {group.sent.map((m) => (
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
                        showCreateTopic={false}
                        isSelected={threadConvId === m.id}
                        onResolvedChange={(resolved, resolvedBy, message) => handleResolvedChange(m.id, resolved, resolved ? (resolvedBy ?? 'You') : undefined, message)}
                        onReactionsChange={(next) => handleReactionsChange(m.id, next)}
                        onHighlightChange={(hl) => handleHighlightChange(m.id, hl)}
                        onBodyChange={(b) => handleBodyChange(m.id, b)}
                        onClick={() => openThread(m.id)}
                        onReply={() => openThread(m.id)}
                        onDelete={() => handleDelete(m.id)}
                      />
                    ))}
                    {group.huddles.map((huddle) => {
                      // safe to access .id — we filtered to conversation != null above
                      const threadId = huddle.seedMessageId ?? huddle.conversation!.id
                      const openHuddle = () => {
                        setSelectedHuddleId(huddle.id)
                        setThreadConvId(threadId)
                        cancelHuddleCreation()
                      }
                      return (
                        <HuddleCard
                          key={huddle.id}
                          huddle={huddle}
                          variant="inStream"
                          isSelected={selectedHuddleId === huddle.id}
                          onClick={openHuddle}
                          onReply={openHuddle}
                          onDelete={() => handleDeleteHuddle(huddle.id)}
                        />
                      )
                    })}
                  </div>
                ))
              ) : (
                <>
                  {currentGroups.map((group) => (
                    <div key={group.dateLabel} className="flex flex-col gap-2">
                      <DateDivider label={group.dateLabel} className="sticky top-0 z-10 bg-bg-surface" />
                      {group.convs.filter((c) => !deletedIds.has(c.id)).map((c) => (
                        <ConversationCard
                          key={`${topicId}_${c.id}`}
                          authorName={c.authorName}
                          timestamp={c.timestamp}
                          body={bodyOverrides[c.id] ?? c.body}
                        attachments={c.attachments}
                          reactions={reactionOverrides[c.id] ?? c.reactions}
                          highlightType={c.id in highlightOverrides ? highlightOverrides[c.id] : c.highlightType}
                          replyCount={(REPLIES[c.id]?.length ?? c.replyCount ?? 0) + (sentReplies[c.id]?.length ?? 0)}
                          hasNewMessage={c.hasNewMessage && (c.isUrgent || showUnreads)}
                          hasNewReply={c.hasNewReply && (c.isUrgent || showUnreads)}
                          isResolved={isConvResolved(c.id, c.isResolved)}
                          resolvedBy={getConvResolvedBy(c.id, c.resolvedBy)}
                          resolutionMessage={getConvResolutionMsg(c.id, c.resolutionMessage)}
                          showCreateTopic={false}
                          isSelected={threadConvId === c.id}
                          onResolvedChange={(resolved, resolvedBy, message) => handleResolvedChange(c.id, resolved, resolved ? (resolvedBy ?? 'You') : undefined, message)}
                          onReactionsChange={(next) => handleReactionsChange(c.id, next)}
                          onHighlightChange={(hl) => handleHighlightChange(c.id, hl)}
                          onBodyChange={(b) => handleBodyChange(c.id, b)}
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
                          showCreateTopic={false}
                          isSelected={threadConvId === m.id}
                          onResolvedChange={(resolved, resolvedBy, message) => handleResolvedChange(m.id, resolved, resolved ? (resolvedBy ?? 'You') : undefined, message)}
                          onReactionsChange={(next) => handleReactionsChange(m.id, next)}
                          onHighlightChange={(hl) => handleHighlightChange(m.id, hl)}
                          onBodyChange={(b) => handleBodyChange(m.id, b)}
                          onClick={() => openThread(m.id)}
                          onReply={() => openThread(m.id)}
                          onDelete={() => handleDelete(m.id)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          {originHuddle && !hasAnyPublicMessages && originHuddle.originDmId != null && (
            <div className="px-3 pt-2">
              <div className="bg-accent-muted rounded-lg p-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="bg-accent-primary rounded-md size-6 flex items-center justify-center shrink-0">
                    <IconPencilMinus size={16} stroke={1.5} className="text-accent-muted" />
                  </div>
                  <span className="text-[14px] leading-[1.4] text-text-primary truncate">
                    This is the beginning of your conversations in{' '}
                    <span className="font-medium">{topicTitle}</span>
                  </span>
                </div>
                <Button variant="muted" size="small" className="shrink-0" onClick={() => {/* TODO: invite-members dialog */}}>
                  Invite members
                </Button>
              </div>
            </div>
          )}
          {/* V3 only: the topic-header "+ Start huddle" button toggles isCreatingHuddle and
              flips the regular composer into the people-picker + first-message creator.
              V2 uses a portalled dialog (rendered below) and never touches the composer. */}
          {isCreatingHuddle && huddleVariant === 3 ? (
            huddleCreatorBlock
          ) : (
            <div className="p-3">
              <ComposeBox onSend={handleSend} contextLabel={topicTitle ? `#${topicTitle}` : undefined} />
            </div>
          )}
        </>
        )
      })()}

      {/* Timeline tab (V1 only). With Intelligence on, it shows the real topic
          timeline; otherwise the original placeholder. */}
      {huddleVariant === 1 && activeTab === 'timeline' && (
        debug.intelligence.enabled && topicId != null && TOPIC_TIMELINES[topicId] ? (
          <TimelineView
            topicId={topicId}
            onEntryClick={(entry) => {
              setActiveTab('conversations')
              openThread(entry.anchorConvId)
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState message="A selective view of how this topic evolved - highlights, resolutions, and key events." />
          </div>
        )
      )}

      {/* Huddles tab (V1 only) */}
      {huddleVariant === 1 && activeTab === 'huddles' && (
        <>
          {currentHuddles.length === 0 && !isCreatingHuddle ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <EmptyState message="No huddles yet - start a private discussion with a few people or AI." />
              <button
                onClick={() => setIsCreatingHuddle(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-bg-elevated border border-border-default text-caption text-text-secondary hover:bg-bg-hover transition-colors cursor-pointer"
              >
                <IconPlus size={14} stroke={1.5} />
                New Huddle
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                {currentHuddles.map((huddle) => {
                  // Promoted-from-DM huddles route the thread to the original DM
                  // message id so replies/reactions/highlights mirror across both
                  // entry points (DM thread panel and huddle thread panel).
                  // Empty huddles (no seed) just select without opening a thread.
                  const threadId = huddle.seedMessageId ?? huddle.conversation?.id
                  const openHuddle = () => {
                    setSelectedHuddleId(huddle.id)
                    if (threadId) setThreadConvId(threadId)
                    cancelHuddleCreation()
                  }
                  return (
                    <HuddleCard
                      key={huddle.id}
                      huddle={huddle}
                      isSelected={selectedHuddleId === huddle.id}
                      onClick={openHuddle}
                      onReply={openHuddle}
                      onDelete={() => handleDeleteHuddle(huddle.id)}
                    />
                  )
                })}
                <div className={cn(
                  'flex flex-col items-center justify-center gap-2 h-[130px]',
                  currentHuddles.length % 2 === 0 && 'col-span-2'
                )}>
                  <IconButton
                    variant="primary"
                    disabled={isCreatingHuddle}
                    onClick={() => setIsCreatingHuddle(true)}
                    aria-label="New Huddle"
                  >
                    <IconPlus size={16} stroke={1.5} />
                  </IconButton>
                  <span className="text-caption text-text-primary">New Huddle</span>
                </div>
              </div>
            </div>
          )}
          {isCreatingHuddle && huddleCreatorBlock}
        </>
      )}

      {/* V2 dialog: members-only, portalled, sits above any body branch. */}
      {isCreatingHuddle && huddleVariant === 2 && (
        <StartHuddleDialog
          onConfirm={handleStartHuddleFromDialog}
          onCancel={() => setIsCreatingHuddle(false)}
        />
      )}
    </div>
  )

  const threadPanel = threadConv ? (
    <ThreadPanel
      conversation={threadConv}
      replies={threadReplies}
      sentReplies={threadSentReplies}
      isResolved={isConvResolved(threadConv.id, threadConv.isResolved)}
      huddleMembers={
        // V2 huddle view already shows lock + members in the rightPanel header,
        // so we suppress the duplicate pill on ThreadPanel.
        selectedHuddleId && huddleVariant !== 2
          ? currentHuddles.find((h) => h.id === selectedHuddleId)?.members ?? []
          : []
      }
      huddleMemberCount={
        selectedHuddleId && huddleVariant !== 2
          ? currentHuddles.find((h) => h.id === selectedHuddleId)?.members.length
          : undefined
      }
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
              // Reopen — clear everything including the reply pointer.
              return { ...prev, [threadConvId]: { resolved: false } }
            })
          : undefined
      }
      promotionDivider={
        promotedHuddleForThread && topic
          ? {
              topicId: topic.id,
              topicTitle: topic.title,
              topicResolved,
              dateLabel: promotedHuddleForThread.promotedAt ?? '',
              promotedAtMs: promotedHuddleForThread.promotedAtMs,
              // We're already on this topic page; clicking the link should switch to
              // the Conversations tab and close the thread panel rather than re-issue
              // a no-op navigation that wouldn't reset local tab state.
              onTopicClick: () => {
                setActiveTab('conversations')
                closeThread()
              },
            }
          : undefined
      }
      onOpenInDm={
        promotedHuddleForThread && promotedHuddleForThread.originDmId !== undefined && threadConvId
          ? () => {
              const dmId = promotedHuddleForThread.originDmId
              // Stage the pending thread id BEFORE navigating so the DM view can consume
              // it on mount. Context state is more reliable than location.state across
              // route transitions (location.state can be reset by replace navigations).
              setPendingDmThreadId(threadConvId)
              navigate(`/people/${dmId}`)
            }
          : undefined
      }
      onClose={closeThread}
      onSendReply={handleSendReply}
      onDeleteReply={handleDeleteReply}
      onInitialBodyChange={
        selectedHuddleId && threadConvId
          ? (newBody: string) => setHuddleBodyOverrides((prev) => ({ ...prev, [threadConvId]: newBody }))
          : undefined
      }
      onReplyBodyChange={(replyId, body) => setBodyOverrides((prev) => ({ ...prev, [replyId]: body }))}
      onReplyHighlightChange={(replyId, hl) => setHighlightOverrides((prev) => ({ ...prev, [replyId]: hl }))}
      onReplyReactionsChange={(replyId, next) => setReactionOverrides((prev) => ({ ...prev, [replyId]: next }))}
    />
  ) : undefined

  return { rightPanel, threadPanel }
}
