import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { WithTooltip } from './WithTooltip'

type IconButtonVariant = 'muted' | 'outlined' | 'primary'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant
  tooltip?: string
  tooltipPlacement?: 'top' | 'bottom'
  children: ReactNode
}

export function IconButton({
  variant = 'muted',
  className,
  children,
  disabled,
  tooltip,
  tooltipPlacement,
  ...props
}: IconButtonProps) {
  const button = (
    <button
      className={cn(
        'flex items-center justify-center p-1 rounded-lg transition-colors shrink-0 cursor-pointer',
        // Variant styles - only when not disabled
        !disabled && variant === 'primary' && 'bg-accent-primary hover:bg-accent-hover text-text-inverse',
        !disabled && variant === 'muted' && 'text-text-secondary hover:bg-bg-hover hover:text-text-primary',
        !disabled && variant === 'outlined' && 'border border-border-default hover:bg-bg-hover text-text-secondary',
        // Disabled styles - per variant to match Figma spec
        disabled && variant === 'primary' && 'bg-bg-disabled text-text-disabled',
        disabled && variant === 'muted' && 'text-text-disabled',
        disabled && variant === 'outlined' && 'border border-border-default text-text-disabled',
        disabled && 'pointer-events-none cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )

  if (tooltip) {
    return <WithTooltip label={tooltip} placement={tooltipPlacement}>{button}</WithTooltip>
  }
  return button
}
