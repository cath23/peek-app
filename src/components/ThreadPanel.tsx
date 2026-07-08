import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconX, IconExternalLink, IconCircleDashed, IconCircleCheck, IconLock, IconTimeline, IconArrowBackUp } from '@tabler/icons-react'
import { Avatar } from './ui/Avatar'
import { IconButton } from './ui/IconButton'
import { ThreadReplyCard } from './ThreadReplyCard'
import { ComposeBox, type SendPayload } from './ui/ComposeBox'
import { DateDivider } from './ui/DateDivider'
import type { ConversationData, HighlightType, ReactionData } from '@/data/topicData'
import type { ReplyData } from '@/data/replyData'
import { HighlightPill } from './ui/HighlightPill'
import { partitionRepliesAroundPromotion } from '@/lib/threadPartition'
import { useDebug } from '@/lib/debug'
import { registerCatchUp } from '@/lib/intelligenceBridge'
import { THREAD_CHECKPOINTS, type ThreadCheckpoint } from '@/data/timelineData'

// ── Pinned Initial Message (compact) ──

interface PinnedMessageProps {
  authorName: string
  authorAvatarSrc?: string
  timestamp: string
  body: string
  highlightType?: HighlightType
}

function PinnedMessage({ authorName, authorAvatarSrc, timestamp, body, highlightType }: PinnedMessageProps) {
  // Strip newlines and show single-line truncated text
  const flatBody = body.replace(/\n/g, ' ')

  return (
    <div className="bg-bg-elevated border border-border-default rounded-lg overflow-hidden">
      <div className="flex flex-col p-2">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Avatar size={24} src={authorAvatarSrc} alt={authorName} />
          <span className="text-body-2-strong text-text-primary whitespace-nowrap">{authorName}</span>
          <span className="text-caption text-text-muted whitespace-nowrap">{timestamp}</span>
          {highlightType && <HighlightPill type={highlightType} />}
        </div>
        {/* Truncated body */}
        <div className="pl-8 pr-2 pt-1 pb-2">
          <p className="text-caption text-text-secondary truncate leading-[1.2]">
            {flatBody}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Thread Panel ──

interface ThreadPanelProps {
  conversation: ConversationData
  replies: ReplyData[]
  sentReplies: ReplyData[]
  isResolved?: boolean
  /** When set, shows member avatars in the header (for Huddle threads) */
  huddleMemberCount?: number
  /** Member names for the huddle - drives the avatar lookups in the header pill */
  huddleMembers?: string[]
  /** DM thread participants - shows You + the other person in the header pill */
  dmMembers?: string[]
  /** Per-reply overrides keyed by reply id. Used to surface persisted body / highlight / reactions. */
  replyBodyOverrides?: Record<string, string>
  replyHighlightOverrides?: Record<string, HighlightType | undefined>
  replyReactionOverrides?: Record<string, ReactionData[]>
  /** Reactions on the initial (pinned) message — needed when the panel renders the initial as a
   *  ThreadReplyCard (huddle case) so reactions added on this side persist & mirror to the DM side. */
  initialReactions?: ReactionData[]
  onInitialReactionsChange?: (reactions: ReactionData[]) => void
  /** Highlight on the initial message — same purpose as reactions: mirror across DM and huddle. */
  initialHighlightType?: HighlightType
  onInitialHighlightChange?: (highlightType: HighlightType | undefined) => void
  /** Id of the reply (if any) that triggered the parent's resolution. The matching ThreadReplyCard
   *  surfaces the resolution inline in edit mode so the user can update or remove it from the reply. */
  resolvedByReplyId?: string
  /** Current resolution message on the parent conv. Forwarded to the resolution-owning reply card. */
  resolutionMsg?: string
  /** Called when the resolution-owning reply card edits the resolution. The parent updates the
   *  parent conv's resolution override accordingly (or reopens it when removed). */
  onResolutionChange?: (resolved: boolean, message?: string) => void
  /**
   * When set, an inline divider is rendered between the static `replies` (pre-promotion)
   * and the runtime `sentReplies` (post-promotion). Used to mark the moment a DM
   * conversation was promoted to a topic — visible from both DM and huddle entry points.
   * If `onTopicClick` is provided, it overrides the Link's default navigation (used when
   * the topic is already the current page and we just need to switch tabs / close the panel).
   * `promotedAtMs` is the numeric promotion time used to partition runtime sentReplies
   * chronologically: replies with createdAtMs < promotedAtMs render above the divider.
   */
  promotionDivider?: { topicId: string; topicTitle: string; topicResolved?: boolean; dateLabel: string; promotedAtMs?: number; onTopicClick?: () => void }
  /** When set, renders a header button that jumps to the matching DM thread. Used from the huddle side only. */
  onOpenInDm?: () => void
  onClose: () => void
  onSendReply: (payload: SendPayload) => void
  onDeleteReply?: (id: string) => void
  onInitialBodyChange?: (newBody: string) => void
  onReplyBodyChange?: (replyId: string, body: string) => void
  onReplyHighlightChange?: (replyId: string, type: HighlightType | undefined) => void
  onReplyReactionsChange?: (replyId: string, reactions: ReactionData[]) => void
}

export function ThreadPanel({
  conversation,
  replies,
  sentReplies,
  isResolved = false,
  huddleMemberCount,
  huddleMembers = [],
  dmMembers = [],
  replyBodyOverrides = {},
  replyHighlightOverrides = {},
  replyReactionOverrides = {},
  promotionDivider,
  initialReactions,
  onInitialReactionsChange,
  initialHighlightType,
  onInitialHighlightChange,
  resolvedByReplyId,
  resolutionMsg,
  onResolutionChange,
  onOpenInDm,
  onClose,
  onSendReply,
  onDeleteReply,
  onInitialBodyChange,
  onReplyBodyChange,
  onReplyHighlightChange,
  onReplyReactionsChange,
}: ThreadPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const allReplies = [...replies, ...sentReplies]

  // ── Catch me up (Intelligence prototype) ──
  // Threads with precomputed checkpoints can swap the reply list for a
  // checkpoints-only view and back. The launcher can trigger it too (bridge).
  const { state: debug } = useDebug()
  const checkpoints: ThreadCheckpoint[] | undefined = debug.intelligence.enabled
    ? THREAD_CHECKPOINTS[conversation.id]
    : undefined
  const newCount = allReplies.filter((r) => r.isNew).length
  const [threadView, setThreadView] = useState<'replies' | 'checkpoints'>('replies')

  useEffect(() => {
    setThreadView('replies')
  }, [conversation.id])

  useEffect(() => {
    if (!checkpoints) return
    registerCatchUp({
      convId: conversation.id,
      newCount,
      activate: () => setThreadView('checkpoints'),
    })
    return () => registerCatchUp(null)
  }, [checkpoints, conversation.id, newCount])

  const jumpToReply = (cp: ThreadCheckpoint) => {
    setThreadView('replies')
    requestAnimationFrame(() => {
      scrollRef.current
        ?.querySelector(`[data-reply-id="${cp.anchorReplyId}"]`)
        ?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    })
  }

  // When a promotion divider is rendered, replies are split chronologically
  // around the promotion event (see lib/threadPartition for the rule).
  const { above: aboveReplies, below: postDividerSent } = promotionDivider
    ? partitionRepliesAroundPromotion({ replies, sentReplies, promotedAtMs: promotionDivider.promotedAtMs })
    : { above: allReplies, below: [] as typeof sentReplies }

  // Scroll to bottom when new replies are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [allReplies.length])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 shrink-0 flex items-center justify-between pl-5 pr-4 py-2 border-b border-border-subtle z-20 relative bg-bg-surface">
        <div className="flex items-center gap-2">
          {huddleMemberCount != null && (
            <IconLock size={16} stroke={1.5} className="text-text-secondary" />
          )}
          <span className="text-body-2-strong text-text-primary">Replies</span>
        </div>
        <div className="flex items-center gap-2">
          {isResolved && (
            <span className="text-caption text-success-default">Resolved</span>
          )}
          {(() => {
            // Show member pill for huddle threads OR DM threads. Both display
            // up to 3 avatars with the total count beside them.
            const members =
              huddleMembers.length > 0
                ? huddleMembers
                : dmMembers.length > 0
                  ? dmMembers
                  : []
            const total = members.length || huddleMemberCount || 0
            if (total === 0) return null
            return (
              <div className="bg-bg-elevated border border-border-default rounded-sm flex gap-2 items-center pl-[2px] pr-2 py-[2px]">
                <div className="flex items-center pr-2">
                  {(members.length > 0
                    ? members.slice(0, 3).map((name, i) => ({ key: i, name }))
                    : Array.from({ length: Math.min(total, 3) }, (_, i) => ({ key: i, name: undefined as string | undefined }))
                  ).map(({ key, name }) => (
                    <div
                      key={key}
                      className="-mr-2 relative shrink-0 size-6 rounded-sm overflow-hidden border-2 border-bg-elevated"
                    >
                      <Avatar size={24} name={name} alt={name} />
                    </div>
                  ))}
                </div>
                <span className="text-caption text-text-secondary">{total}</span>
              </div>
            )
          })()}
          {onOpenInDm && (
            <IconButton tooltip="Open original" aria-label="Open original" onClick={onOpenInDm}>
              <IconExternalLink size={16} stroke={1.5} />
            </IconButton>
          )}
          <IconButton tooltip="Close" aria-label="Close thread" onClick={onClose}>
            <IconX size={16} stroke={1.5} />
          </IconButton>
        </div>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col">
        {/* Initial message */}
        <div className="px-4 pt-4 pb-2">
          {huddleMemberCount != null ? (
            /* Huddle: show full message like a reply */
            <ThreadReplyCard
              authorName={conversation.authorName}
              timestamp={conversation.timestamp}
              body={conversation.body}
              attachments={conversation.attachments}
              reactions={initialReactions}
              highlightType={initialHighlightType}
              onBodyChange={onInitialBodyChange}
              onReactionsChange={onInitialReactionsChange}
              onHighlightChange={onInitialHighlightChange}
            />
          ) : (
            <PinnedMessage
              authorName={conversation.authorName}
              timestamp={conversation.timestamp}
              body={conversation.body}
              highlightType={conversation.highlightType}
            />
          )}
        </div>

        {/* Checkpoints-only view (Catch me up) - replaces the reply list. */}
        {threadView === 'checkpoints' && checkpoints && (
          <>
            <DateDivider label="Catch me up" className="px-4 py-2" />
            <div className="flex flex-col px-4 pb-4 gap-1">
              {checkpoints.map((cp) => (
                <div
                  key={cp.id}
                  className="flex gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-bg-hover transition-colors"
                  onClick={() => jumpToReply(cp)}
                >
                  <div className="flex flex-col items-center pt-[7px] w-3 shrink-0">
                    <div className="size-1.5 rounded-full bg-border-strong" />
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <span className="text-caption text-text-muted">{cp.time}</span>
                    <p className="text-sm text-text-secondary leading-[1.45]">{cp.sentence}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {threadView === 'replies' && (
        <>
        {/* Replies divider */}
        <DateDivider label="Replies" className="px-4 py-2" />

        {/* Reply list - chronological top to bottom. When the conversation was promoted to a
            topic, a system-event divider is inserted between the pre-promotion replies (static)
            and the post-promotion replies (sentReplies). */}
        <div className="flex flex-col px-4 pb-4 gap-2">
          {aboveReplies.map((reply) => (
            <div key={reply.id} data-reply-id={reply.id}>
            <ThreadReplyCard
              authorName={reply.authorName}
              timestamp={reply.timestamp}
              body={replyBodyOverrides[reply.id] ?? reply.body}
              attachments={reply.attachments}
              highlightType={
                reply.id in replyHighlightOverrides ? replyHighlightOverrides[reply.id] : reply.highlightType
              }
              reactions={replyReactionOverrides[reply.id]}
              isNew={reply.isNew}
              isUrgent={reply.isUrgent}
              ownsResolution={resolvedByReplyId === reply.id}
              resolutionMsg={resolvedByReplyId === reply.id ? resolutionMsg : undefined}
              onResolutionChange={resolvedByReplyId === reply.id ? onResolutionChange : undefined}
              onDelete={onDeleteReply ? () => onDeleteReply(reply.id) : undefined}
              onBodyChange={onReplyBodyChange ? (b) => onReplyBodyChange(reply.id, b) : undefined}
              onHighlightChange={onReplyHighlightChange ? (h) => onReplyHighlightChange(reply.id, h) : undefined}
              onReactionsChange={onReplyReactionsChange ? (r) => onReplyReactionsChange(reply.id, r) : undefined}
            />
            </div>
          ))}
          {promotionDivider && (
            <DateDivider
              className="px-0 py-1"
              label={
                <span className="inline-flex items-center gap-1.5 text-text-secondary">
                  {promotionDivider.topicResolved ? (
                    <IconCircleCheck size={14} stroke={1.5} className="text-success-default" />
                  ) : (
                    <IconCircleDashed size={14} stroke={1.5} />
                  )}
                  <span>
                    Promoted to{' '}
                    <Link
                      to={`/topics/${promotionDivider.topicId}`}
                      data-interactive
                      onClick={(e) => {
                        e.stopPropagation()
                        // When the parent provides an override (e.g. we're already on the
                        // topic page and just need to switch tabs + close the thread),
                        // suppress the no-op navigation and run the callback instead.
                        if (promotionDivider.onTopicClick) {
                          e.preventDefault()
                          promotionDivider.onTopicClick()
                        }
                      }}
                      className="text-text-primary hover:underline"
                    >
                      {promotionDivider.topicTitle}
                    </Link>
                    {' · '}
                    {promotionDivider.dateLabel}
                  </span>
                </span>
              }
            />
          )}
          {promotionDivider && postDividerSent.map((reply) => (
            <ThreadReplyCard
              key={reply.id}
              authorName={reply.authorName}
              timestamp={reply.timestamp}
              body={replyBodyOverrides[reply.id] ?? reply.body}
              attachments={reply.attachments}
              highlightType={
                reply.id in replyHighlightOverrides ? replyHighlightOverrides[reply.id] : reply.highlightType
              }
              reactions={replyReactionOverrides[reply.id]}
              isNew={reply.isNew}
              isUrgent={reply.isUrgent}
              ownsResolution={resolvedByReplyId === reply.id}
              resolutionMsg={resolvedByReplyId === reply.id ? resolutionMsg : undefined}
              onResolutionChange={resolvedByReplyId === reply.id ? onResolutionChange : undefined}
              onDelete={onDeleteReply ? () => onDeleteReply(reply.id) : undefined}
              onBodyChange={onReplyBodyChange ? (b) => onReplyBodyChange(reply.id, b) : undefined}
              onHighlightChange={onReplyHighlightChange ? (h) => onReplyHighlightChange(reply.id, h) : undefined}
              onReactionsChange={onReplyReactionsChange ? (r) => onReplyReactionsChange(reply.id, r) : undefined}
            />
          ))}
        </div>
        </>
        )}
      </div>

      {/* Catch me up toggle - floats above the reply composer. */}
      {checkpoints && (
        <div className="relative h-0 z-10">
          <div className="absolute -top-2 inset-x-0 flex justify-center -translate-y-full pointer-events-none">
            <button
              type="button"
              className="pointer-events-auto flex items-center gap-1.5 h-7 px-3 rounded-full bg-bg-elevated border border-border-default shadow-sm text-caption text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
              onClick={() => setThreadView((v) => (v === 'replies' ? 'checkpoints' : 'replies'))}
            >
              {threadView === 'replies' ? (
                <>
                  <IconTimeline size={13} stroke={1.5} />
                  <span>{newCount > 0 ? `${newCount} new · Catch me up` : 'Catch me up'}</span>
                </>
              ) : (
                <>
                  <IconArrowBackUp size={13} stroke={1.5} />
                  <span>Show all replies</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Compose box */}
      <div className="p-3">
        <ComposeBox onSend={onSendReply} placeholder="reply" contextLabel={`Reply to ${conversation.authorName}`} />
      </div>
    </div>
  )
}
