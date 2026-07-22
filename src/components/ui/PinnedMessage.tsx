import { Avatar } from './Avatar'
import { HighlightPill } from './HighlightPill'
import type { HighlightType } from '@/api'

// ── Pinned Initial Message (compact) ──
//
// The original message shown pinned at the top of the thread panel: same author
// header as a full card, but the body is flattened to a single truncated line.

export interface PinnedMessageProps {
  authorName: string
  authorAvatarSrc?: string
  timestamp: string
  body: string
  highlightType?: HighlightType
}

export function PinnedMessage({ authorName, authorAvatarSrc, timestamp, body, highlightType }: PinnedMessageProps) {
  // Strip newlines and show single-line truncated text
  const flatBody = body.replace(/\n/g, ' ')

  return (
    <div className="bg-bg-elevated border border-border-default rounded-lg overflow-hidden">
      <div className="flex flex-col p-2">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Avatar size={24} src={authorAvatarSrc} alt={authorName} />
          <span className="text-body-2-strong text-text-primary whitespace-nowrap">{authorName}</span>
          <span className="text-caption text-text-muted whitespace-nowrap signal:font-mono signal:text-[10px] signal:tracking-[0.02em] signal:tabular-nums">{timestamp}</span>
          {highlightType && <HighlightPill type={highlightType} />}
        </div>
        {/* Truncated body */}
        <div className="pl-8 pr-2 pt-1 pb-2">
          <p className="text-caption text-text-secondary truncate leading-[1.2]">
            {flatBody}
          </p>
        </div>
      </div>
    </div>
  )
}
