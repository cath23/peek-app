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
  brand: 'bg-accent-muted text-accent-primary signal:border signal:border-[rgba(86,200,255,0.3)]',
  info: 'bg-info-muted text-info-default signal:border signal:border-[rgba(86,200,255,0.3)]',
  warning: 'bg-warning-muted text-warning-default signal:border signal:border-[rgba(255,176,32,0.3)] signal:shadow-[shadow:0_0_5px_rgba(255,176,32,0.4)]',
  success: 'bg-success-muted text-success-default signal:border signal:border-[rgba(63,222,140,0.3)]',
  error: 'bg-error-muted text-error-default signal:border signal:border-[rgba(255,107,107,0.3)]',
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
      {label && <span className="text-chip whitespace-nowrap signal:font-mono signal:text-[10px] signal:font-semibold signal:tracking-[0.02em] signal:tabular-nums">{label}</span>}
      {trailingIcon && <span className="shrink-0 size-3">{trailingIcon}</span>}
    </div>
  )
}
