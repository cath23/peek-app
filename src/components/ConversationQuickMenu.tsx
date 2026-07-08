import { useRef } from 'react'
import {
  IconMoodPlus,
  IconMessage2,
  IconCircleCheck,
  IconCircleDashed,
  IconDotsVertical,
} from '@tabler/icons-react'
import { IconButton } from './ui/IconButton'
import { cn } from '@/lib/utils'

interface ConversationQuickMenuProps {
  isResolved?: boolean
  onReact?: () => void
  onReply?: () => void
  onResolve?: () => void
  onReopen?: () => void
  onMore?: (rect: DOMRect) => void
  className?: string
}

export function ConversationQuickMenu({
  isResolved = false,
  onReact,
  onReply,
  onResolve,
  onReopen,
  onMore,
  className,
}: ConversationQuickMenuProps) {
  const moreRef = useRef<HTMLDivElement>(null)

  const handleMore = () => {
    if (moreRef.current) {
      onMore?.(moreRef.current.getBoundingClientRect())
    }
  }

  return (
    <div
      className={cn(
        'bg-bg-elevated border border-border-subtle rounded-sm shadow-sm flex items-start gap-1 p-1',
        className
      )}
    >
      <IconButton tooltip="React" aria-label="React" onClick={onReact}>
        <IconMoodPlus size={16} stroke={1.5} />
      </IconButton>
      <IconButton tooltip="Reply" aria-label="Reply" onClick={onReply}>
        <IconMessage2 size={16} stroke={1.5} />
      </IconButton>

      <div className="w-px self-stretch bg-border-subtle" />

      {isResolved ? (
        <IconButton tooltip="Reopen" aria-label="Reopen" onClick={onReopen}>
          <IconCircleDashed size={16} stroke={1.5} />
        </IconButton>
      ) : (
        <IconButton tooltip="Resolve" aria-label="Resolve" onClick={onResolve}>
          <IconCircleCheck size={16} stroke={1.5} />
        </IconButton>
      )}

      <div className="w-px self-stretch bg-border-subtle" />

      <div ref={moreRef} className="inline-flex">
        <IconButton tooltip="More actions" aria-label="More actions" onClick={handleMore}>
          <IconDotsVertical size={16} stroke={1.5} />
        </IconButton>
      </div>
    </div>
  )
}
