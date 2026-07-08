import { cn } from '@/lib/utils'

interface TooltipProps {
  label: string
  className?: string
}

export function Tooltip({ label, className }: TooltipProps) {
  return (
    <div
      className={cn(
        'bg-bg-elevated border border-border-default rounded-lg h-[30px] flex items-center justify-center px-2 shadow-lg',
        className
      )}
    >
      <span className="text-caption text-text-primary whitespace-nowrap">{label}</span>
    </div>
  )
}
