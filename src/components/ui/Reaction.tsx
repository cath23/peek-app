import { cn } from '@/lib/utils'
import { WithTooltip } from './WithTooltip'

/** Canonical meaning of each pickable reaction emoji (picker tooltips +
 *  "reacted with …" pill tooltips). */
export const REACTION_NAMES: Record<string, string> = {
  '👍': 'Makes sense',
  '💯': 'Agree',
  '🙏': 'Thank you',
  '🚀': "Let's go!",
  '🎉': 'Congrats',
}

function joinNames(names: string[]): string {
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/** Slack-style hover label: "Ana, Ben and You reacted with Thank you".
 *  Without names (static mock reactions) it degrades to the reaction name. */
export function reactionTooltipLabel(emoji: string, names?: string[]): string {
  const reactionName = REACTION_NAMES[emoji] ?? emoji
  if (!names || names.length === 0) return reactionName
  return `${joinNames(names)} reacted with ${reactionName}`
}

interface ReactionProps {
  emoji: string
  count: number
  owner?: 'yours' | 'others'
  /** Reactors in reaction order (viewer as 'You') — shown in the tooltip. */
  names?: string[]
  onClick?: () => void
  className?: string
}

export function Reaction({
  emoji,
  count,
  owner = 'others',
  names,
  onClick,
  className,
}: ReactionProps) {
  return (
    <WithTooltip label={reactionTooltipLabel(emoji, names)}>
      <button
        onClick={onClick}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-full min-w-[16px] px-2 py-1 border cursor-pointer transition-colors',
          owner === 'yours'
            ? 'bg-accent-muted border-accent-primary hover:border-accent-hover'
            : 'bg-bg-inset border-border-default hover:bg-bg-active hover:border-border-strong',
          className
        )}
      >
        <span className="text-[16px] leading-none shrink-0">{emoji}</span>
        <span className="text-chip text-text-primary">{count}</span>
      </button>
    </WithTooltip>
  )
}
