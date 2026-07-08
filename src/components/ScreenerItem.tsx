import { IconX } from '@tabler/icons-react'
import { TopicState } from './ui/TopicState'
import { Avatar } from './ui/Avatar'
import { Button } from './ui/Button'
import { IconButton } from './ui/IconButton'
import { useIsTopicResolved } from '@/api'
import type { ScreenerItem as ScreenerItemData } from '@/api'

interface ScreenerItemProps {
  item: ScreenerItemData
  onOpen?: (id: string) => void
  onLater?: (id: string) => void
  onDismiss?: (id: string) => void
}

/** A single incoming item in the Desk Screener: who/what it is, a two-line preview,
 *  and the Open / Later / ✕ Dismiss triage actions. Rendered by ScreenerSection. */
export function ScreenerItem({ item, onOpen, onLater, onDismiss }: ScreenerItemProps) {
  const isTopicResolved = useIsTopicResolved()

  return (
    <div className="flex flex-col p-2 rounded-lg transition-colors hover:bg-bg-hover has-[button:hover]:bg-transparent">
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
          <Button variant="primary" size="small" onClick={() => onOpen?.(item.id)}>
            Open
          </Button>
          <Button variant="outlined" size="small" onClick={() => onLater?.(item.id)}>
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
  )
}
