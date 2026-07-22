import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DateDividerProps {
  label: ReactNode
  className?: string
}

export function DateDivider({ label, className }: DateDividerProps) {
  return (
    <div className={cn('flex items-center gap-2 px-2 py-1.5', className)}>
      <div className="flex-1 h-px bg-border-subtle" />
      <span className="text-h5 text-text-secondary shrink-0 signal:font-mono signal:text-[9.5px] signal:uppercase signal:tracking-[0.12em] signal:text-text-muted">{label}</span>
      <div className="flex-1 h-px bg-border-subtle" />
    </div>
  )
}
