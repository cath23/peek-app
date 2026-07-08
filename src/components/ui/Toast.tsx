import { IconCircleCheck } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'brand' | 'neutral'

interface ToastProps {
  label: string
  /** Visual variant per Figma (Alert component): success, brand, or neutral. */
  type?: ToastType
  /** Show the leading circle-check icon. Defaults to true. */
  leadingIcon?: boolean
  /** When set together with onAction, renders a clickable action on the right side. */
  actionLabel?: string
  onAction?: () => void
  className?: string
}

const SURFACE_BY_TYPE: Record<ToastType, string> = {
  success: 'bg-success-muted',
  brand: 'bg-accent-muted',
  neutral: 'bg-bg-inset border border-border-subtle',
}

const ACTION_BORDER_BY_TYPE: Record<ToastType, string> = {
  success: '',
  brand: '',
  neutral: 'border border-border-default',
}

/** Presentational toast pill (Figma: Alert). Positioning, portal and auto-dismiss
 *  live in ToastProvider (src/lib/toast.tsx). */
export function Toast({
  label,
  type = 'neutral',
  leadingIcon = true,
  actionLabel,
  onAction,
  className,
}: ToastProps) {
  const hasAction = !!(actionLabel && onAction)
  return (
    <div
      className={cn(
        'inline-flex items-center min-h-[32px] pl-2 pr-1 py-1 rounded-lg shadow-lg',
        hasAction ? 'gap-[46px]' : '',
        SURFACE_BY_TYPE[type],
        className,
      )}
    >
      <div className="flex items-center gap-2 shrink-0">
        {leadingIcon && (
          <IconCircleCheck size={16} stroke={1.5} className="text-text-primary shrink-0" />
        )}
        <span className="font-normal text-[14px] leading-[1.4] text-text-primary whitespace-nowrap">
          {label}
        </span>
      </div>
      {hasAction && (
        <button
          type="button"
          onClick={onAction}
          className={cn(
            'h-6 flex items-center justify-center gap-1 px-1 py-1 rounded-md shrink-0 transition-colors',
            ACTION_BORDER_BY_TYPE[type],
            type === 'neutral' ? 'hover:border-border-strong' : 'hover:opacity-80',
          )}
        >
          <span className="font-medium text-[12px] leading-[12px] text-text-primary whitespace-nowrap">
            {actionLabel}
          </span>
        </button>
      )}
    </div>
  )
}
