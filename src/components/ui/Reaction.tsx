import { cn } from '@/lib/utils'

interface ReactionProps {
  emoji: string
  count: number
  owner?: 'yours' | 'others'
  onClick?: () => void
  className?: string
}

export function Reaction({
  emoji,
  count,
  owner = 'others',
  onClick,
  className,
}: ReactionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full min-w-[16px] px-2 py-1 border cursor-pointer transition-colors',
        owner === 'yours'
          ? 'bg-accent-muted border-accent-primary'
          : 'bg-bg-inset border-border-default',
        className
      )}
    >
      <span className="text-[16px] leading-none shrink-0">{emoji}</span>
      <span className="text-chip text-text-primary">{count}</span>
    </button>
  )
}
