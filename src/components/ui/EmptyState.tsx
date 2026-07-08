import { cn } from '@/lib/utils'
import { IconMessage2 } from '@tabler/icons-react'
import { type ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  message?: string
  className?: string
}

export function EmptyState({
  icon,
  message = 'No conversation selected',
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col gap-2 items-center', className)}>
      <span className="text-text-secondary">
        {icon ?? <IconMessage2 size={16} stroke={1.5} />}
      </span>
      <p className="text-body-2 text-text-secondary text-center">{message}</p>
    </div>
  )
}
