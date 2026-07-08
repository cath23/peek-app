import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { IconMessage2, IconDotsVertical, IconLock } from '@tabler/icons-react'
import { Avatar } from './ui/Avatar'
import { Divider } from './ui/Divider'
import { IconButton } from './ui/IconButton'
import { cn } from '@/lib/utils'
import { REPLIES } from '@/data/replyData'
import { useTopicMutations } from '@/lib/topicMutations'
import type { Huddle } from '@/data/huddleData'

interface HuddleCardProps {
  huddle: Huddle
  isSelected?: boolean
  /** 'grid' = legacy 2-col Huddles tab card (130px tall, 2-line preview).
   *  'inStream' = compact V3 inline card (1-line preview, private register, lock icon). */
  variant?: 'grid' | 'inStream'
  onClick?: () => void
  onReply?: () => void
  onDelete?: () => void
  className?: string
}

export function MemberAvatars({
  members,
  count,
  borderClass,
}: {
  members?: string[]
  count?: number
  borderClass?: string
}) {
  // If names are provided, render up to 4 of them with photo lookup; otherwise
  // fall back to count-based placeholders for legacy callers.
  const slots = members ? members.slice(0, 4) : Array.from({ length: Math.min(count ?? 0, 4) }, () => undefined)
  return (
    <div className="flex items-center">
      {slots.map((name, i) => (
        <div
          key={i}
          className={cn(
            'relative shrink-0 size-6 rounded-sm overflow-hidden border-2',
            i > 0 && '-ml-2',
            borderClass ?? 'border-bg-surface'
          )}
        >
          <Avatar size={24} name={name} alt={name} />
        </div>
      ))}
    </div>
  )
}

export function HuddleCard({
  huddle,
  isSelected = false,
  variant = 'grid',
  onClick,
  onReply,
  onDelete,
  className,
}: HuddleCardProps) {
  const inStream = variant === 'inStream'
  const [isHovered, setIsHovered] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Grid keeps the legacy "first + N" truncation; inStream shows full comma-joined
  // names (the user-side label is "you and these other people").
  const gridMemberLabel =
    huddle.members.length <= 2
      ? huddle.members.join(', ')
      : `${huddle.members[0]} + ${huddle.members.length - 1}`
  const inStreamMemberLabel = huddle.members.join(', ')

  // Empty huddles (no seed conversation) show a placeholder preview.
  const bodyText = huddle.conversation?.body ?? 'No messages yet'

  // Reply count = static REPLIES + runtime sentReplies for the thread id the card
  // opens (seedMessageId for promoted huddles, conversation.id otherwise — same id
  // useTopicView uses to open the thread panel). Mirrors how ConversationCard
  // computes its replyCount in the views, so new replies typed in the thread panel
  // increment the card's count without needing a manual refresh.
  const { sentReplies } = useTopicMutations()
  const threadId = huddle.seedMessageId ?? huddle.conversation?.id
  const replyCount = threadId
    ? (REPLIES[threadId]?.length ?? huddle.conversation?.replyCount ?? 0) + (sentReplies[threadId]?.length ?? 0)
    : (huddle.conversation?.replyCount ?? 0)

  const handleMore = (e: React.MouseEvent) => {
    e.stopPropagation()
    const btn = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const MENU_HEIGHT = 100
    const right = window.innerWidth - btn.right
    if (window.innerHeight - btn.bottom < MENU_HEIGHT) {
      setMenuPos({ bottom: window.innerHeight - btn.top + 4, right })
    } else {
      setMenuPos({ top: btn.bottom + 4, right })
    }
    setShowMenu((v) => !v)
  }

  const handleDelete = () => {
    setShowMenu(false)
    onDelete?.()
  }

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return
    const close = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return
      setShowMenu(false)
      setMenuPos(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [showMenu])

  // Single-line preview body for the inStream variant — strip newlines so the
  // truncate happens cleanly at the card's right edge.
  const flatBody = bodyText.replace(/\n+/g, ' ').trim()

  return (
    <>
      <div
        className={cn(
          'relative flex flex-col rounded-lg cursor-pointer transition-colors overflow-hidden',
          'border',
          inStream ? '' : 'h-[130px]',
          // Color register:
          // inStream V3 huddles use bg-surface for the body — same tier as
          // ConversationCard so they sit at the same level on the page. The
          // bg-inset banner above (same surface tier as the ComposeBox container)
          // does the visual differentiation: a labeled inset/recessed strip in
          // light mode, a lighter strip in dark mode.
          inStream
            ? isSelected
              ? 'bg-bg-selected border-border-default'
              : isHovered
                ? 'bg-bg-hover border-border-default'
                : 'bg-bg-surface border-border-default'
            : isSelected
              ? 'bg-bg-selected border-border-subtle'
              : isHovered
                ? 'bg-bg-hover border-border-default'
                : 'bg-bg-surface border-border-subtle',
          className
        )}
        onClick={(e) => {
          if (showMenu) return
          const target = e.target as HTMLElement
          if (target.closest('button, [role="button"], [data-interactive]')) return
          onClick?.()
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          if (showMenu) return
          setIsHovered(false)
        }}
      >
        {/* "Huddle" top banner — V3 inStream only. A neutral elevated-grey strip
            (lighter than the body's bg-private), edge-to-edge so the parent's
            rounded-lg + overflow-hidden give it rounded top corners. Differentiates
            the card in V3's mixed stream where huddles and conversation cards appear
            side by side. */}
        {inStream && (
          <div className="h-6 bg-bg-inset px-2 flex items-center shrink-0">
            <span className="text-caption text-text-primary leading-none">Huddle</span>
          </div>
        )}

        {/* Body wrapper — owns padding (so the banner can fill edge-to-edge) and is the
            positioning parent for the hover-menu absolute overlay. When the inStream
            reply footer renders we drop the wrapper's bottom padding so the footer's
            own pb-1.5 owns the bottom spacing exactly like ConversationCard does. */}
        <div className={cn(
          'relative flex flex-col px-2 pt-2',
          inStream ? 'gap-1' : 'flex-1',
          inStream && replyCount > 0 ? '' : 'pb-2',
        )}>
        {/* Header. inStream uses a single 24px lock-avatar (purple square with lock icon)
            instead of overlapping member avatars — communicates "this is a huddle" with
            one icon and clusters [avatar + names + timestamp] together like ConversationCard.
            grid keeps the legacy member-avatars + first-only name preview. */}
        <div className="flex items-center gap-2">
          {inStream ? (
            <div className="size-6 rounded-sm bg-bg-inset flex items-center justify-center shrink-0">
              <IconLock size={16} stroke={1.5} className="text-text-primary" />
            </div>
          ) : (
            <MemberAvatars
              members={huddle.members}
              borderClass={
                isSelected ? 'border-bg-selected' : isHovered ? 'border-bg-hover' : 'border-bg-surface'
              }
            />
          )}
          {/* tw-merge silently drops `text-body-2-strong` when followed by `text-text-primary`
              inside a cn() call (both share the `text-` prefix). Explicit arbitrary values
              preserve the body-2-strong styling: 14px / 140% line-height / weight 500. */}
          <span className={cn(
            'text-[14px] leading-[140%] font-medium text-text-primary truncate',
            // inStream: shrink so the timestamp can sit immediately after the names.
            // grid: take remaining flex width so the timestamp stays at the right edge.
            inStream ? 'min-w-0' : 'flex-1'
          )}>
            {inStream ? inStreamMemberLabel : gridMemberLabel}
          </span>
          <span className="text-caption text-text-muted whitespace-nowrap shrink-0">
            {inStream
              ? (huddle.conversation?.timestamp ?? huddle.lastActivity)
              : huddle.conversation
                ? `${huddle.lastActivity}, ${huddle.conversation.timestamp}`
                : huddle.lastActivity}
          </span>
        </div>

        {/* Body preview — 1 line in inStream, 2 lines in grid. inStream's body is
            indented with pl-8 to align under the names (matches ConversationCard's
            body which uses pl-8 to sit under the author name). */}
        {inStream ? (
          <p className="pl-8 text-caption text-text-secondary leading-[1.4] truncate">
            {flatBody}
          </p>
        ) : (
          <div className="pt-1 flex-1 min-h-0 overflow-hidden">
            <p className="text-caption text-text-secondary leading-[1.4] line-clamp-2">
              {bodyText.split('\n').filter(Boolean).map((line, i) => {
                const cleaned = line.replace(/^[-•]\s/, '• ').replace(/^\d+\.\s/, (m) => m)
                return (
                  <span key={i}>
                    {i > 0 && <br />}
                    {cleaned}
                  </span>
                )
              })}
            </p>
          </div>
        )}

        {/* Reply-count footer.
            grid: compact 14px icon + caption text, hugs the bottom of the card.
            inStream: matches ConversationCard's footer exactly (16px icon, text-chip,
            pl-8 pr-2 pb-1.5) so huddles and conversations sitting side by side in
            V3's mixed stream share the same reply-count chrome. */}
        {!inStream && replyCount > 0 && (
          <div className="flex items-center gap-2 text-text-secondary h-6">
            <IconMessage2 size={14} stroke={1.5} className="shrink-0" />
            <span className="text-caption">
              {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </span>
          </div>
        )}
        {inStream && replyCount > 0 && (
          <div className="flex items-center gap-2 pl-8 pr-2 pb-1.5 w-full">
            <div className="flex items-center gap-2 py-1.5 shrink-0">
              <IconMessage2 size={16} stroke={1.5} className="text-text-secondary shrink-0" />
              <span className="text-chip text-text-secondary">
                {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
              </span>
            </div>
          </div>
        )}

        {/* Quick menu on hover — same pattern in both variants */}
        {isHovered && (
          <div className="absolute right-[3px] top-[3px]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-bg-elevated border border-border-subtle rounded-sm shadow-sm flex items-start gap-1 p-1">
              <IconButton tooltip="Reply" aria-label="Reply" onClick={() => { onReply?.(); onClick?.() }}>
                <IconMessage2 size={16} stroke={1.5} />
              </IconButton>
              <div className="w-px self-stretch bg-border-subtle" />
              <IconButton tooltip="More actions" aria-label="More actions" onClick={handleMore}>
                <IconDotsVertical size={16} stroke={1.5} />
              </IconButton>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* More menu (portalled) */}
      {showMenu && menuPos &&
        createPortal(
          <div
            ref={menuRef}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseLeave={() => { setShowMenu(false); setMenuPos(null); setIsHovered(false) }}
            style={{
              position: 'fixed',
              ...(menuPos.top !== undefined ? { top: menuPos.top } : {}),
              ...(menuPos.bottom !== undefined ? { bottom: menuPos.bottom } : {}),
              right: menuPos.right,
              zIndex: 50,
            }}
          >
            <div className="bg-bg-elevated border border-border-default rounded-lg shadow-lg w-[244px] p-2 flex flex-col gap-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-bg-hover">
                  <span className="flex-1 text-sm text-text-secondary">View details</span>
                </div>
              </div>
              <Divider className="mx-0" />
              <div
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-bg-hover"
                onClick={handleDelete}
              >
                <span className="flex-1 text-sm text-error-default">Delete</span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
