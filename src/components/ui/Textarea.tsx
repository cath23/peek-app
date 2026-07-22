import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/**
 * Multi-line text field — the shared form textarea (e.g. the resolution
 * message). Non-resizable by default; pass a height via `className`
 * (e.g. `h-[109px]`). Font size uses explicit `text-[14px]` so it survives
 * tw-merge alongside `text-text-primary` (see CLAUDE.md pitfall).
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          'bg-bg-inset border border-border-default focus:border-border-strong rounded-lg px-3 py-2',
          'text-[14px] leading-[1.4] font-normal text-text-primary placeholder:text-text-muted',
          'resize-none outline-none transition-colors',
          'signal:transition-shadow signal:focus:border-border-focus signal:focus:shadow-[shadow:var(--focus-ring)]',
          className,
        )}
        {...props}
      />
    )
  },
)
