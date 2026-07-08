import { useState } from 'react'
import { IconDotsVertical, IconAlertSquareRounded, IconX } from '@tabler/icons-react'
import { TopicState, type TopicStateType, type TopicStateStatus } from './TopicState'
import { IconButton } from './IconButton'
import { cn } from '@/lib/utils'
import { avatarFor } from '@/api'

interface PersonRowProps {
  name: string
  type?: TopicStateType
  topicStatus?: TopicStateStatus
  isUnread?: boolean
  isUrgent?: boolean
  isSelected?: boolean
  avatarSrc?: string
  memberCount?: number
  onClick?: () => void
  /** When provided, replaces the hover "more options" 3-dot icon with an X
   *  that calls this handler. Used by Open work rows so users can remove an
   *  item from the list. */
  onRemove?: () => void
  className?: string
}

export function PersonRow({
  name,
  type = 'topic',
  topicStatus = 'unresolved',
  isUnread = false,
  isUrgent = false,
  isSelected = false,
  avatarSrc,
  memberCount,
  onClick,
  onRemove,
  className,
}: PersonRowProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 h-[32px] rounded-lg cursor-pointer transition-colors',
        isSelected ? 'bg-bg-selected' : isHovered ? 'bg-bg-hover' : '',
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <TopicState
        type={type}
        status={type === 'topic' ? topicStatus : 'default'}
        avatarSrc={avatarSrc ?? (type === 'DM' ? avatarFor(name) : undefined)}
        memberCount={memberCount}
        iconClassName={isSelected || isUnread ? 'text-text-primary' : undefined}
      />

      <span
        className={cn(
          'flex-1 text-sm truncate',
          isUnread ? 'font-medium' : 'font-normal',
          isSelected || isUnread ? 'text-text-primary' : 'text-text-secondary'
        )}
      >
        {name}
      </span>

      {/* Right slot - rendered only when there's something to show, so the title
          can use the full row width when idle. Slight layout shift on hover is intentional. */}
      {isHovered ? (
        <div className="w-6 h-6 flex items-center justify-center shrink-0">
          {onRemove ? (
            <IconButton
              tooltip="Remove from list"
              aria-label="Remove from list"
              onClick={(e) => { e.stopPropagation(); onRemove() }}
              className="-m-1"
            >
              <IconX size={16} stroke={1.5} />
            </IconButton>
          ) : (
            <IconButton
              tooltip="More options"
              aria-label="More options"
              onClick={(e) => e.stopPropagation()}
              className="-m-1"
            >
              <IconDotsVertical size={16} stroke={1.5} />
            </IconButton>
          )}
        </div>
      ) : isUrgent && isUnread ? (
        <div className="w-6 h-6 flex items-center justify-center shrink-0">
          <div className="flex items-center p-0.5 rounded-full bg-warning-muted">
            <IconAlertSquareRounded size={12} stroke={2.5} className="text-warning-default" />
          </div>
        </div>
      ) : isUnread ? (
        <div className="w-6 h-6 flex items-center justify-center shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
        </div>
      ) : null}
    </div>
  )
}
