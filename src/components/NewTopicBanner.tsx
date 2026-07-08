import { IconPencilMinus } from '@tabler/icons-react'
import { Button } from './ui/Button'

interface NewTopicBannerProps {
  topicTitle: string
  onInviteMembers?: () => void
}

/** Empty-state banner at the top of a freshly-created topic (promoted from a DM, no public
 *  conversations yet): "This is the beginning of your conversations in <Topic>" + Invite members. */
export function NewTopicBanner({ topicTitle, onInviteMembers }: NewTopicBannerProps) {
  return (
    <div className="bg-accent-muted rounded-lg p-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="bg-accent-primary rounded-md size-6 flex items-center justify-center shrink-0">
          <IconPencilMinus size={16} stroke={1.5} className="text-accent-muted" />
        </div>
        <span className="text-[14px] leading-[1.4] text-text-primary truncate">
          This is the beginning of your conversations in{' '}
          <span className="font-medium">{topicTitle}</span>
        </span>
      </div>
      <Button variant="muted" size="small" className="shrink-0" onClick={onInviteMembers}>
        Invite members
      </Button>
    </div>
  )
}
