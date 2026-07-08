import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/**
 * Single-line text field — the shared form input used inside dialogs and
 * settings. Stretches to fill its container (place inside a `flex flex-col`,
 * e.g. `Field`). Font size uses explicit `text-[14px]` (not `text-body-2`) so
 * it survives tw-merge alongside `text-text-primary` (see CLAUDE.md pitfall).
 */
export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, type = 'text', ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'bg-bg-inset border border-border-default focus:border-border-strong rounded-lg px-3 py-2',
          'text-[14px] leading-[1.4] font-normal text-text-primary placeholder:text-text-muted',
          'outline-none transition-colors',
          className,
        )}
        {...props}
      />
    )
  },
)
