import { cn } from '@/lib/utils'
import { REACTION_NAMES } from './ui/Reaction'
import { WithTooltip } from './ui/WithTooltip'

export const REACTION_EMOJIS = ['👍', '💯', '🙏', '🚀', '🎉']

interface ReactionPickerProps {
  onSelect: (emoji: string) => void
  className?: string
}

export default function ReactionPicker({ onSelect, className }: ReactionPickerProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-0.5 rounded-lg border border-border-default bg-bg-elevated p-1.5',
        'shadow-lg',
        className,
      )}
    >
      {REACTION_EMOJIS.map((emoji) => (
        <WithTooltip key={emoji} label={REACTION_NAMES[emoji] ?? emoji}>
          <button
            type="button"
            onClick={() => onSelect(emoji)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[18px] hover:bg-bg-hover"
          >
            {emoji}
          </button>
        </WithTooltip>
      ))}
    </div>
  )
}
