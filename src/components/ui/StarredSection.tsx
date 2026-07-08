import { useState } from 'react'
import { IconChevronRight } from '@tabler/icons-react'
import { PersonRow } from './PersonRow'
import { cn } from '@/lib/utils'
import type { TopicStateType, TopicStateStatus } from './TopicState'

export interface StarredItem {
  id: number
  name: string
  type?: TopicStateType
  topicStatus?: TopicStateStatus
  isUnread?: boolean
  avatarSrc?: string
  memberCount?: number
}

interface StarredSectionProps {
  items?: StarredItem[]
  selectedId?: number | null
  onSelect?: (id: number) => void
  className?: string
}

export function StarredSection({
  items = [],
  selectedId,
  onSelect,
  className,
}: StarredSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const isEmpty = items.length === 0

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div
        className="group flex h-[32px] items-center justify-between px-2 rounded-lg cursor-pointer transition-colors hover:bg-bg-hover"
        onClick={() => setIsExpanded((v) => !v)}
      >
        <div className="flex items-center gap-1">
          <IconChevronRight
            size={12}
            stroke={1.5}
            className={cn(
              'text-text-secondary transition-transform duration-150',
              isExpanded && 'rotate-90'
            )}
          />
          <span className="text-h5 text-text-primary">
            Starred
          </span>
        </div>
      </div>

      {/* Body */}
      {isExpanded && (
        isEmpty ? (
          <p className="px-2 py-1 text-[12px] text-text-muted leading-[1.4]">
            Favorite the conversations of People or Topics you interact mostly with
          </p>
        ) : (
          <div className="flex flex-col gap-1 mt-1">
            {items.map((item) => (
              <PersonRow
                key={item.id}
                name={item.name}
                type={item.type}
                topicStatus={item.topicStatus}
                isUnread={item.isUnread}
                isSelected={selectedId === item.id}
                avatarSrc={item.avatarSrc}
                memberCount={item.memberCount}
                onClick={() => onSelect?.(item.id)}
              />
            ))}
          </div>
        )
      )}
    </div>
  )
}
