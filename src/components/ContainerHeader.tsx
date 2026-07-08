import {
  IconCircleDashed,
  IconChevronDown,
  IconSortDescending,
  IconEdit,
} from '@tabler/icons-react'
import { IconButton } from './ui/IconButton'
import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

interface ContainerHeaderProps {
  title: string
  chevron?: boolean
  leadingIcon?: boolean
  /** Custom slot rendered between title area and action buttons */
  more?: ReactNode
  /** 1st action button - defaults to Edit icon */
  prop1stAction?: boolean
  prop1stActionTooltip?: string
  /** 2nd action button - defaults to Sort Descending icon */
  prop2ndAction?: boolean
  prop2ndActionTooltip?: string
  /** 3rd action button - defaults to Sort Descending icon (hidden by default, for future use) */
  prop3rdAction?: boolean
  prop3rdActionTooltip?: string
  className?: string
}

export function ContainerHeader({
  title,
  chevron = false,
  leadingIcon = false,
  more,
  prop1stAction = false,
  prop1stActionTooltip,
  prop2ndAction = false,
  prop2ndActionTooltip,
  prop3rdAction = false,
  prop3rdActionTooltip,
  className,
}: ContainerHeaderProps) {
  const hasRightContent = more || prop1stAction || prop2ndAction || prop3rdAction

  return (
    <div
      className={cn(
        'h-12 shrink-0 flex items-center justify-between overflow-hidden',
        'pl-5 pr-4 py-2 border-b border-border-subtle',
        className
      )}
    >
      {/* Left - leading icon + title + optional chevron */}
      <div className="flex gap-2 items-center overflow-hidden shrink-0">
        {leadingIcon && (
          <IconCircleDashed size={16} stroke={1.5} className="text-text-muted shrink-0" />
        )}
        <div className="flex gap-1 items-center shrink-0">
          <span className="text-body-2-strong text-text-primary whitespace-nowrap">
            {title}
          </span>
          {chevron && (
            <IconChevronDown size={12} stroke={1.5} className="text-text-secondary shrink-0" />
          )}
        </div>
      </div>

      {/* Right - more slot + action buttons */}
      {hasRightContent && (
        <div className="flex gap-3 items-center justify-end shrink-0">
          {more && <div className="shrink-0">{more}</div>}
          {(prop1stAction || prop2ndAction || prop3rdAction) && (
            <div className="flex gap-1 items-center justify-end">
              {prop3rdAction && (
                <IconButton tooltip={prop3rdActionTooltip} aria-label={prop3rdActionTooltip ?? 'Sort'}>
                  <IconSortDescending size={16} stroke={1.5} />
                </IconButton>
              )}
              {prop2ndAction && (
                <IconButton tooltip={prop2ndActionTooltip} aria-label={prop2ndActionTooltip ?? 'Sort'}>
                  <IconSortDescending size={16} stroke={1.5} />
                </IconButton>
              )}
              {prop1stAction && (
                <IconButton tooltip={prop1stActionTooltip} aria-label={prop1stActionTooltip ?? 'Edit'}>
                  <IconEdit size={16} stroke={1.5} />
                </IconButton>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
