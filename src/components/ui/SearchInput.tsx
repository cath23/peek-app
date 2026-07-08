import { cn } from '@/lib/utils'
import { type InputHTMLAttributes } from 'react'

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  shortcut?: string
  className?: string
}

export function SearchInput({
  shortcut,
  className,
  placeholder = 'Search Peek...',
  ...props
}: SearchInputProps) {
  return (
    <div
      className={cn(
        'flex gap-2 items-center px-3 py-2 rounded-lg',
        'bg-bg-inset border border-border-default',
        'focus-within:border-border-strong transition-colors',
        className
      )}
    >
      <input
        className="flex-1 min-w-0 bg-transparent text-input-value text-text-primary placeholder:text-text-muted outline-none"
        placeholder={placeholder}
        {...props}
      />
      {shortcut && (
        <div className="flex items-center justify-center px-1 py-px rounded-sm bg-bg-inset border border-border-strong shrink-0">
          <span className="text-caption text-text-secondary whitespace-nowrap">{shortcut}</span>
        </div>
      )}
    </div>
  )
}
