import { cn } from '@/lib/utils'
import { TOPIC_TIMELINES, type TimelineEntry, type TimelineEntryKind } from '@/data/timelineData'

const KIND_META: Record<TimelineEntryKind, { label: string; className: string }> = {
  'topic-created': { label: 'Topic created', className: 'bg-accent-muted text-accent-primary' },
  'new-conversation': { label: 'New conversation', className: 'bg-bg-active text-text-secondary' },
  'new-replies': { label: 'New replies', className: 'bg-bg-active text-text-secondary' },
  resolution: { label: 'Resolution', className: 'bg-success-muted text-success-default' },
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Actor names render bold inside the sentence, per the timeline design. */
function renderSentence(sentence: string, actors: string[]) {
  if (actors.length === 0) return sentence
  const pattern = new RegExp(`(${actors.map(escapeRe).join('|')})`, 'g')
  return sentence.split(pattern).map((part, i) =>
    actors.includes(part) ? (
      <span key={i} className="text-text-primary font-medium">
        {part}
      </span>
    ) : (
      part
    )
  )
}

export function TimelineEntryRow({ entry, onClick }: { entry: TimelineEntry; onClick?: () => void }) {
  const meta = KIND_META[entry.kind]
  return (
    <div
      className={cn('flex gap-3 rounded-lg px-2 py-2 -mx-2 transition-colors', onClick && 'cursor-pointer hover:bg-bg-hover')}
      onClick={onClick}
    >
      {/* Dot rail */}
      <div className="flex flex-col items-center pt-[7px] shrink-0 w-3">
        <div className="size-1.5 rounded-full bg-border-strong" />
      </div>

      <div className="flex flex-col flex-1 min-w-0 gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium leading-[1.2] whitespace-nowrap', meta.className)}>
            {meta.label}
          </span>
          <span className="text-caption text-text-muted whitespace-nowrap shrink-0">{entry.time}</span>
        </div>
        <p className="text-sm text-text-secondary leading-[1.45]">{renderSentence(entry.sentence, entry.actors)}</p>
      </div>
    </div>
  )
}

interface TimelineViewProps {
  topicId: string
  /** Clicking an entry opens the anchored conversation's thread. */
  onEntryClick?: (entry: TimelineEntry) => void
}

/**
 * The topic timeline: how the topic evolved, as typed events with one
 * AI-written sentence each. The event skeleton (kinds, times, anchors) is
 * structural fact; resolutions reuse the human message verbatim.
 */
export function TimelineView({ topicId, onEntryClick }: TimelineViewProps) {
  const entries = TOPIC_TIMELINES[topicId] ?? []

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-sm text-text-secondary">Nothing on this topic's timeline yet.</span>
      </div>
    )
  }

  // Group consecutive entries by their date label, preserving order.
  const groups: { dateLabel: string; entries: TimelineEntry[] }[] = []
  for (const entry of entries) {
    const last = groups[groups.length - 1]
    if (last && last.dateLabel === entry.dateLabel) last.entries.push(entry)
    else groups.push({ dateLabel: entry.dateLabel, entries: [entry] })
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[680px] mx-auto w-full px-6 py-5 flex flex-col">
        {groups.map((group) => (
          <div key={group.dateLabel} className="flex flex-col">
            <div className="flex items-center gap-3 py-2.5">
              <span className="text-caption text-text-secondary whitespace-nowrap">{group.dateLabel}</span>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>
            <div className="flex flex-col gap-1 pb-3">
              {group.entries.map((entry) => (
                <TimelineEntryRow key={entry.id} entry={entry} onClick={onEntryClick ? () => onEntryClick(entry) : undefined} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
