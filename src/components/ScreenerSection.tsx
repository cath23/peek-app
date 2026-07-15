import { useState } from 'react'
import { IconChevronRight } from '@tabler/icons-react'
import { Chip } from './ui/Chip'
import { cn } from '@/lib/utils'
import { ScreenerItem } from './ScreenerItem'
import type { ScreenerItem as ScreenerItemData } from '@/api'

interface ScreenerSectionProps {
  items: ScreenerItemData[]
  onOpen?: (id: string) => void
  onLater?: (id: string, untilMs: number) => void
  onDismiss?: (id: string) => void
  className?: string
}

export function ScreenerSection({ items, onOpen, onLater, onDismiss, className }: ScreenerSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (items.length === 0) return null

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header (accordion) */}
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
            <ScreenerItem
              key={item.id}
              item={item}
              onOpen={onOpen}
              onLater={onLater}
              onDismiss={onDismiss}
            />
          ))}
        </div>
      )}
    </div>
  )
}
