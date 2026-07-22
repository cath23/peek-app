import { useEffect, useRef, useState, type ReactNode } from 'react'
import { IconStar, IconStarFilled, IconDotsVertical, IconLockPlus, IconLock } from '@tabler/icons-react'
import { TopicState } from './ui/TopicState'
import { Avatar } from './ui/Avatar'
import { AvatarGroup } from './ui/AvatarGroup'
import { IconButton } from './ui/IconButton'
import { MembersMenu } from './MembersMenu'
import { cn } from '@/lib/utils'

interface ConversationHeaderProps {
  avatarSrc?: string
  name?: string
  /** When true, shows topic-mode layout: TopicState icon, status counts, members */
  topicMode?: boolean
  /** V2 huddle main-view header: lock icon on the left, no open/resolved counts. Members pill still
   *  shows when `members` is provided. Pairs with `name` carrying the comma-joined member names. */
  huddleMode?: boolean
  isResolved?: boolean
  openCount?: number
  resolvedCount?: number
  /** Hide counts and members pill (e.g. when Huddles tab is active) */
  hideTopicMeta?: boolean
  /** Topic participants — drives the avatars + count in the members pill */
  members?: string[]
  isStarred?: boolean
  onToggleStarred?: () => void
  /** When provided, renders a "Start a huddle" icon button next to the members pill. */
  onStartHuddle?: () => void
  /** When provided (viewer is a member, topic mode), the members popover gets
   *  an "Add members" row that opens the invite flow. */
  onAddMembers?: () => void
  tabs?: ReactNode
  className?: string
}

export function ConversationHeader({
  avatarSrc,
  name,
  topicMode = false,
  huddleMode = false,
  isResolved = false,
  openCount = 0,
  resolvedCount = 0,
  hideTopicMeta = false,
  members = [],
  isStarred = false,
  onToggleStarred,
  onStartHuddle,
  onAddMembers,
  tabs,
  className,
}: ConversationHeaderProps) {
  // Members popover (topic mode only). Menu rules: outside click, Escape,
  // and leaving the pill+popover region all close it.
  const [showMembers, setShowMembers] = useState(false)
  const membersRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!showMembers) return
    const onDown = (e: MouseEvent) => {
      if (membersRef.current && !membersRef.current.contains(e.target as Node)) setShowMembers(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMembers(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [showMembers])

  return (
    <div className={cn('shrink-0 border-b border-border-subtle', className)}>
      {/* Row 1: title + actions */}
      <div className="h-12 flex items-center justify-between pl-5 pr-4 py-2">
        {/* Left */}
        <div className="flex items-center gap-2 overflow-hidden">
          {huddleMode ? (
            <IconLock size={16} stroke={1.5} className="text-text-secondary shrink-0" />
          ) : topicMode ? (
            <TopicState
              type="topic"
              status={isResolved ? 'resolved' : 'unresolved'}
              iconClassName="text-text-secondary"
            />
          ) : (
            <Avatar size={16} src={avatarSrc} alt={name} />
          )}
          {name && (
            <span className="text-body-2-strong text-text-primary truncate">{name}</span>
          )}
        </div>

        {/* Right */}
        <div className="flex gap-3 items-center shrink-0">
          {topicMode && !hideTopicMeta && !huddleMode && (
            <>
              {/* Open / resolved counts */}
              <div className="flex items-center gap-2">
                <span className="text-caption text-text-secondary whitespace-nowrap">
                  {openCount} open
                </span>
                <div className="w-[3px] h-[3px] rounded-full bg-text-muted shrink-0" />
                <span className="text-caption text-success-default whitespace-nowrap">
                  {resolvedCount} resolved
                </span>
              </div>
            </>
          )}

          {/* Members pill — shown for both topic mode and huddle mode. In topic
              mode it opens the members popover (huddle membership is set at
              creation, so the huddle pill stays inert). */}
          {(topicMode || huddleMode) && !hideTopicMeta && members.length > 0 && (
            <div
              ref={topicMode ? membersRef : undefined}
              className="relative"
              onMouseLeave={() => setShowMembers(false)}
            >
              <button
                type="button"
                aria-label={`${members.length} members`}
                disabled={!topicMode}
                onClick={() => setShowMembers((v) => !v)}
                className={cn(
                  'bg-bg-elevated border border-border-default rounded-sm flex gap-2 items-center pl-[2px] pr-2 py-[2px]',
                  topicMode && 'cursor-pointer hover:border-border-strong transition-colors',
                )}
              >
                <AvatarGroup members={members} />
                <span className="text-caption text-text-secondary">{members.length}</span>
              </button>
              {topicMode && showMembers && (
                <div className="absolute right-0 top-full pt-1 z-50">
                  <MembersMenu
                    members={members}
                    onAddMembers={
                      onAddMembers
                        ? () => {
                            setShowMembers(false)
                            onAddMembers()
                          }
                        : undefined
                    }
                  />
                </div>
              )}
            </div>
          )}

          {/* Start huddle (V2 / V3 only — driven by onStartHuddle prop). Hidden inside a huddle. */}
          {onStartHuddle && !huddleMode && (
            <IconButton
              tooltip="Start a huddle"
              aria-label="Start a huddle"
              onClick={onStartHuddle}
            >
              <IconLockPlus size={16} stroke={1.5} />
            </IconButton>
          )}

          {/* Action buttons */}
          <div className="flex gap-1 items-center">
            <IconButton
              tooltip={isStarred ? 'Remove from starred' : 'Add to starred'}
              aria-label={isStarred ? 'Remove from starred' : 'Add to starred'}
              onClick={onToggleStarred}
            >
              {isStarred ? (
                <IconStarFilled size={16} className="text-warning-default" />
              ) : (
                <IconStar size={16} stroke={1.5} />
              )}
            </IconButton>
            <IconButton tooltip="More actions" aria-label="More actions">
              <IconDotsVertical size={16} stroke={1.5} />
            </IconButton>
          </div>
        </div>
      </div>

      {/* Row 2: tabs */}
      {tabs && (
        <div className="pl-5 pr-4 pb-2">
          {tabs}
        </div>
      )}
    </div>
  )
}
