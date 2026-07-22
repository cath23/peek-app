import { IconPencilMinus } from '@tabler/icons-react'
import { Button } from './ui/Button'

interface NewTopicBannerProps {
  /** Topic title (kind="topic") or DM partner name (kind="dm"). */
  title: string
  /** "topic" shows the Invite members button; "dm" is copy-only. */
  kind?: 'topic' | 'dm'
  onInviteMembers?: () => void
}

/** Empty-state banner above the composer of a conversation with no messages yet:
 *  topics get "…your conversations in <Topic>" + Invite members; DMs get
 *  "…your conversation with <Name>" without the invite action. */
export function NewTopicBanner({ title, kind = 'topic', onInviteMembers }: NewTopicBannerProps) {
  return (
    <div className="bg-accent-muted rounded-lg p-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="bg-accent-primary rounded-md size-6 flex items-center justify-center shrink-0">
          <IconPencilMinus size={16} stroke={1.5} className="text-accent-muted signal:text-[color:var(--text-inverse)]" />
        </div>
        <span className="text-[14px] leading-[1.4] text-text-primary truncate">
          {kind === 'dm' ? 'This is the beginning of your conversation with' : 'This is the beginning of your conversations in'}{' '}
          <span className="font-medium">{title}</span>
        </span>
      </div>
      {kind === 'topic' && (
        <Button variant="muted" size="small" className="shrink-0" onClick={onInviteMembers}>
          Invite members
        </Button>
      )}
    </div>
  )
}
