import { useState } from 'react'
import { IconChevronRight, IconX } from '@tabler/icons-react'
import { TopicState } from './ui/TopicState'
import { Avatar } from './ui/Avatar'
import { Chip } from './ui/Chip'
import { Button } from './ui/Button'
import { IconButton } from './ui/IconButton'
import { cn } from '@/lib/utils'
import { useTopicMutations } from '@/lib/topicMutations'
import type { ScreenerItem } from '@/data/screenerData'

interface ScreenerSectionProps {
  items: ScreenerItem[]
  onOpen?: (id: string) => void
  onLater?: (id: string) => void
  onDismiss?: (id: string) => void
  className?: string
}

export function ScreenerSection({ items, onOpen, onLater, onDismiss, className }: ScreenerSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const { isTopicResolved } = useTopicMutations()

  if (items.length === 0) return null

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
          <span className="text-h5 text-text-primary">Screener</span>
        </div>
        <Chip type="brand" label={String(items.length)} />
      </div>

      {/* Items */}
      {isExpanded && (
        <div className="flex flex-col gap-0.5 mt-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col p-2 rounded-lg transition-colors hover:bg-bg-hover has-[button:hover]:bg-transparent"
            >
              {/* Item header */}
              <div className="flex items-center gap-2">
                {item.kind === 'topic' ? (
                  <TopicState type="topic" status={isTopicResolved(item.topicId) ? 'resolved' : 'unresolved'} />
                ) : (
                  <Avatar size={16} src={item.authorAvatarSrc} alt={item.authorName} />
                )}
                <span className="text-body-2-strong text-text-primary truncate">
                  {item.kind === 'topic' ? item.topicTitle : item.authorName}
                </span>
              </div>

              {/* Preview */}
              <div className="pl-6 pr-2 py-1">
                <p className="text-caption text-text-secondary line-clamp-2">{item.preview}</p>
              </div>

              {/* Actions */}
              {/* Previous leading icons (dropped for visual calm): Open → IconPlus, Later → IconHistory */}
              <div className="flex items-center justify-between pl-6 pt-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => onOpen?.(item.id)}
                  >
                    Open
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => onLater?.(item.id)}
                  >
                    Later
                  </Button>
                </div>
                <IconButton
                  variant="outlined"
                  tooltip="Dismiss"
                  aria-label="Dismiss"
                  onClick={() => onDismiss?.(item.id)}
                >
                  <IconX size={16} stroke={1.5} />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
