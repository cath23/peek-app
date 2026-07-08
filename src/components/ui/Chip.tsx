import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ChipType = 'neutral' | 'brand' | 'info' | 'warning' | 'success' | 'error'

interface ChipProps {
  type?: ChipType
  label?: string
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  className?: string
}

const typeStyles: Record<ChipType, string> = {
  neutral: 'bg-bg-inset text-text-primary',
  brand: 'bg-accent-muted text-accent-primary',
  info: 'bg-info-muted text-info-default',
  warning: 'bg-warning-muted text-warning-default',
  success: 'bg-success-muted text-success-default',
  error: 'bg-error-muted text-error-default',
}

export function Chip({
  type = 'neutral',
  label,
  leadingIcon,
  trailingIcon,
  className,
}: ChipProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full max-h-[20px] min-w-[16px] px-2 py-1',
        typeStyles[type],
        className
      )}
    >
      {leadingIcon && <span className="shrink-0 size-3">{leadingIcon}</span>}
      {label && <span className="text-chip whitespace-nowrap">{label}</span>}
      {trailingIcon && <span className="shrink-0 size-3">{trailingIcon}</span>}
    </div>
  )
}
