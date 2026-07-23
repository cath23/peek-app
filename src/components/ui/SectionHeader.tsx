import { useState, type ReactNode } from 'react'
import { IconChevronRight, IconPlus, IconSortDescending } from '@tabler/icons-react'
import { IconButton } from './IconButton'
import { cn } from '@/lib/utils'

/**
 * THE section-header label — every section title in the app (Desk sections,
 * Screener, Starred, topic sidebar sections, menu headings, the composer's
 * slash menu) renders through this span so a style change is one edit.
 * Ruling 2026-07-23: labels stay text-primary under Signal too.
 * Metrics match the old `text-h5` (12px/100%/500) — written as arbitrary
 * values because tw-merge silently drops custom text-{name} classes when a
 * text-{color} follows in a merged list.
 */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'text-[12px] leading-[12px] font-medium text-text-primary signal:font-mono signal:text-[10px] signal:uppercase signal:tracking-[0.14em]',
        className
      )}
    >
      {children}
    </span>
  )
}

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
        <SectionLabel>{title}</SectionLabel>
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
