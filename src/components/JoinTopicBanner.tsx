import { IconUserPlus } from '@tabler/icons-react'
import { Button } from './ui/Button'

interface JoinTopicBannerProps {
  title: string
  onJoin?: () => void
}

/** Banner above the composer of a topic you're NOT a member of (QA #2.7):
 *  same visual as NewTopicBanner; invites you to join the topic. Content
 *  stays fully readable — membership gates participation, not visibility. */
export function JoinTopicBanner({ title, onJoin }: JoinTopicBannerProps) {
  return (
    <div className="bg-accent-muted rounded-lg p-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="bg-accent-primary rounded-md size-6 flex items-center justify-center shrink-0">
          <IconUserPlus size={16} stroke={1.5} className="text-accent-muted" />
        </div>
        <span className="text-[14px] leading-[1.4] text-text-primary truncate">
          You&apos;re not a member of <span className="font-medium">{title}</span> yet — join to
          take part in the conversation
        </span>
      </div>
      <Button variant="muted" size="small" className="shrink-0" onClick={onJoin}>
        Join topic
      </Button>
    </div>
  )
}
