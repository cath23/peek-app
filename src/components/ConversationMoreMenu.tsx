import { useState, useRef, useCallback, useEffect } from 'react'
import {
  IconCircleDashed,
  IconCircleCheck,
  IconPlus,
  IconArrowBack,
  IconHighlight,
  IconChevronRight,
  IconX,
} from '@tabler/icons-react'
import { Divider } from './ui/Divider'
import { HighlightSwatch } from './ui/HighlightPill'
import { cn } from '@/lib/utils'
import { HIGHLIGHT_META, type HighlightType } from '@/api'

interface ConversationMoreMenuProps {
  isTopic?: boolean
  isResolved?: boolean
  showCreateTopic?: boolean
  /** True when the message was authored by the current user. Gates Edit/Delete. */
  isOwnMessage?: boolean
  currentHighlight?: HighlightType
  onHighlight?: (type: HighlightType | undefined) => void
  onCreateTopic?: () => void
  onRevertToConversation?: () => void
  onResolve?: () => void
  onReopen?: () => void
  onOpenWork?: () => void
  onEditMessage?: () => void
  onViewDetails?: () => void
  onDelete?: () => void
  className?: string
}

function MenuItem({
  icon,
  label,
  shortcut,
  destructive,
  onClick,
}: {
  icon?: React.ReactNode
  label: string
  shortcut?: string
  destructive?: boolean
  onClick?: () => void
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-bg-hover w-full',
      )}
      onClick={onClick}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span
        className={cn(
          'flex-1 text-sm truncate',
          destructive ? 'text-error-default' : 'text-text-secondary'
        )}
      >
        {label}
      </span>
      {shortcut && (
        <kbd className="inline-flex items-center justify-center bg-bg-inset border border-border-strong rounded-sm px-1 py-[1px] text-caption text-text-secondary shrink-0">
          {shortcut}
        </kbd>
      )}
    </div>
  )
}

export function ConversationMoreMenu({
  isTopic = false,
  isResolved = false,
  showCreateTopic = true,
  isOwnMessage = false,
  currentHighlight,
  onHighlight,
  onCreateTopic,
  onRevertToConversation,
  onResolve,
  onReopen,
  onOpenWork,
  onEditMessage,
  onViewDetails,
  onDelete,
  className,
}: ConversationMoreMenuProps) {
  const [showHighlightSub, setShowHighlightSub] = useState(false)
  const [subOnLeft, setSubOnLeft] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const openSub = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setShowHighlightSub(true)
  }, [])

  const closeSub = useCallback(() => {
    closeTimer.current = setTimeout(() => setShowHighlightSub(false), 150)
  }, [])

  // Measure whether the submenu fits to the right; if not, flip to left
  useEffect(() => {
    if (!showHighlightSub || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const subWidth = 160 + 8 // w-[160px] + ml-1 gap
    setSubOnLeft(rect.right + subWidth > window.innerWidth)
  }, [showHighlightSub])

  return (
    <div
      data-interactive
      className={cn(
        'bg-bg-elevated border border-border-default rounded-lg shadow-lg w-[244px] p-2 flex flex-col gap-2',
        className
      )}
    >
      <div className="flex flex-col">
        <div className="flex h-[32px] items-center px-2">
          <span className="text-h5 text-text-primary">Utilities</span>
        </div>

        {isTopic ? (
          <>
            <MenuItem
              icon={<IconArrowBack size={16} stroke={1.5} className="text-text-secondary" />}
              label="Revert to conversation"
              onClick={onRevertToConversation}
            />
          </>
        ) : showCreateTopic ? (
          <MenuItem
            icon={<IconCircleDashed size={16} stroke={1.5} className="text-text-secondary" />}
            label="Start topic"
            onClick={onCreateTopic}
          />
        ) : null}

        {isResolved ? (
          <MenuItem
            icon={<IconCircleDashed size={16} stroke={1.5} className="text-text-secondary" />}
            label="Reopen"
            onClick={onReopen}
          />
        ) : (
          <MenuItem
            icon={<IconCircleCheck size={16} stroke={1.5} className="text-text-secondary" />}
            label="Resolve"
            shortcut="→"
            onClick={onResolve}
          />
        )}

        <MenuItem
          icon={<IconPlus size={16} stroke={1.5} className="text-text-secondary" />}
          label="Open work"
          onClick={onOpenWork}
        />

        {onHighlight && (
          <div className="relative">
            <div
              ref={triggerRef}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-bg-hover w-full"
              onMouseEnter={openSub}
              onMouseLeave={closeSub}
            >
              <IconHighlight size={16} stroke={1.5} className="text-text-secondary shrink-0" />
              <span className="flex-1 text-sm text-text-secondary">
                {currentHighlight ? 'Change highlight' : 'Mark as Highlight'}
              </span>
              <IconChevronRight size={16} stroke={1.5} className="text-text-muted shrink-0" />
            </div>
            {showHighlightSub && (
              <div
                className={cn(
                  'absolute top-0 bg-bg-elevated border border-border-default rounded-lg shadow-lg w-[160px] p-2 z-50',
                  subOnLeft ? 'right-full mr-1' : 'left-full ml-1'
                )}
                onMouseEnter={openSub}
                onMouseLeave={closeSub}
              >
                {(['insight', 'concern', 'conclusion', 'question', 'summary'] as HighlightType[]).map((type) => (
                  <div
                    key={type}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-bg-hover',
                      currentHighlight === type && 'bg-bg-hover'
                    )}
                    onClick={() => onHighlight(type)}
                  >
                    <HighlightSwatch type={type} />
                    <span className="text-sm text-text-secondary">{HIGHLIGHT_META[type].label}</span>
                  </div>
                ))}
                {currentHighlight && (
                  <>
                    <div className="h-px bg-border-subtle mx-1 my-1" />
                    <div
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-bg-hover"
                      onClick={() => onHighlight(undefined)}
                    >
                      <IconX size={16} stroke={1.5} className="text-text-secondary shrink-0" />
                      <span className="text-sm text-text-secondary">Remove</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Divider className="mx-0" />

      <div className="flex flex-col">
        {!isTopic && isOwnMessage && (
          <MenuItem label="Edit message" onClick={onEditMessage} />
        )}
        <MenuItem label="View details" onClick={onViewDetails} />
      </div>

      {isOwnMessage && (
        <>
          <Divider className="mx-0" />
          <MenuItem label="Delete" destructive onClick={onDelete} />
        </>
      )}
    </div>
  )
}
