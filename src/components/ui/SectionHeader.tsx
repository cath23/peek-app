import { useState } from 'react'
import { IconChevronRight, IconPlus, IconSortDescending } from '@tabler/icons-react'
import { IconButton } from './IconButton'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  chevron?: boolean
  prop1stAction?: boolean
  prop2ndAction?: boolean
  prop1stActionTooltip?: string
  prop2ndActionTooltip?: string
  isExpanded?: boolean
  onToggle?: () => void
  onFirstAction?: () => void
  onSecondAction?: () => void
  className?: string
}

export function SectionHeader({
  title,
  chevron = false,
  prop1stAction = false,
  prop2ndAction = false,
  prop1stActionTooltip = 'Add',
  prop2ndActionTooltip = 'Sort by',
  isExpanded = true,
  onToggle,
  onFirstAction,
  onSecondAction,
  className,
}: SectionHeaderProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        'flex h-[32px] items-center justify-between px-2 rounded-lg transition-colors',
        isHovered && 'bg-bg-hover',
        chevron && 'cursor-pointer',
        className
      )}
      onClick={chevron ? onToggle : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-1 shrink-0">
        {chevron && (
          <IconChevronRight
            size={12}
            stroke={1.5}
            className={cn(
              'text-text-secondary transition-transform duration-150',
              isExpanded && 'rotate-90'
            )}
          />
        )}
        <span className="text-h5 text-text-primary">
          {title}
        </span>
      </div>

      {isHovered && (prop1stAction || prop2ndAction) && (
        <div className="flex items-center gap-1">
          {prop2ndAction && (
            <IconButton
              tooltip={prop2ndActionTooltip}
              aria-label={prop2ndActionTooltip}
              onClick={(e) => { e.stopPropagation(); onSecondAction?.() }}
            >
              <IconSortDescending size={16} stroke={1.5} />
            </IconButton>
          )}
          {prop1stAction && (
            <IconButton
              tooltip={prop1stActionTooltip}
              aria-label={prop1stActionTooltip}
              onClick={(e) => { e.stopPropagation(); onFirstAction?.() }}
            >
              <IconPlus size={16} stroke={1.5} />
            </IconButton>
          )}
        </div>
      )}
    </div>
  )
}
