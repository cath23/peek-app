import { type ReactNode } from 'react'
import { IconStar, IconStarFilled, IconDotsVertical, IconLockPlus, IconLock, IconTimeline } from '@tabler/icons-react'
import { TopicState } from './ui/TopicState'
import { Avatar } from './ui/Avatar'
import { IconButton } from './ui/IconButton'
import { cn } from '@/lib/utils'

interface ConversationHeaderProps {
  avatarSrc?: string
  name?: string
  /** When true, shows topic-mode layout: TopicState icon, status counts, members, timeline button */
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
  /** Intelligence prototype: renders a Timeline icon button that switches the
   *  topic body between conversations and the topic timeline. */
  onToggleTimeline?: () => void
  timelineActive?: boolean
  /** Small element rendered right after the name (e.g. an "Agent" chip). */
  badge?: ReactNode
  /** Group conversations: renders the member-count badge instead of an avatar,
   *  matching the group rows in the People list. */
  groupCount?: number
  tabs?: ReactNode
  className?: string
}

/** Up to 3 overlapping 24px avatars with border-bg-surface outline - matches Figma members component */
function AvatarGroup({ members }: { members: string[] }) {
  const visible = members.slice(0, 3)
  return (
    <div className="flex items-center pr-2">
      {visible.map((name, i) => (
        <div
          key={i}
          className="-mr-2 relative shrink-0 size-6 rounded-sm overflow-hidden border-2 border-bg-surface"
        >
          <Avatar size={24} name={name} alt={name} />
        </div>
      ))}
    </div>
  )
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
  onToggleTimeline,
  timelineActive = false,
  badge,
  groupCount,
  tabs,
  className,
}: ConversationHeaderProps) {
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
          ) : groupCount != null ? (
            <TopicState type="group" memberCount={groupCount} />
          ) : (
            <Avatar size={16} src={avatarSrc} alt={name} />
          )}
          {name && (
            <span className="text-body-2-strong text-text-primary truncate">{name}</span>
          )}
          {badge}
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

          {/* Members pill — shown for both topic mode and huddle mode */}
          {(topicMode || huddleMode) && !hideTopicMeta && members.length > 0 && (
            <div className="bg-bg-elevated border border-border-default rounded-sm flex gap-2 items-center pl-[2px] pr-2 py-[2px]">
              <AvatarGroup members={members} />
              <span className="text-caption text-text-secondary">{members.length}</span>
            </div>
          )}

          {/* Timeline toggle (Intelligence prototype) - next to the huddle button. */}
          {onToggleTimeline && !huddleMode && (
            <IconButton
              tooltip={timelineActive ? 'Back to conversations' : 'Timeline'}
              aria-label="Toggle timeline"
              onClick={onToggleTimeline}
              className={timelineActive ? 'text-accent-primary hover:text-accent-primary bg-bg-active' : undefined}
            >
              <IconTimeline size={16} stroke={1.5} />
            </IconButton>
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
