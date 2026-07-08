import { useCallback } from 'react'
import { Avatar } from './Avatar'
import { cn } from '@/lib/utils'
import { type Person } from '@/data/peopleData'

/** An app row in the @ menu (Intelligence prototype): selecting it opens the
 *  launcher pre-scoped to the app, with the consumed token as insert point. */
export interface MentionAppItem {
  kind: 'app-query'
  app: 'figma' | 'linear'
  label: string
  icon: string
  description: string
}

interface MentionMenuProps {
  people: Person[]
  /** Rendered below people (human-first ordering). Highlight index spans both. */
  apps?: MentionAppItem[]
  highlight: number
  isUrgent: boolean
  onSelect: (person: Person) => void
  onSelectApp?: (app: MentionAppItem) => void
  onHighlightChange: (index: number) => void
}

export function MentionMenu({ people, apps = [], highlight, isUrgent, onSelect, onSelectApp, onHighlightChange }: MentionMenuProps) {
  const scrollRef = useCallback((el: HTMLDivElement | null) => {
    el?.scrollIntoView({ block: 'nearest' })
  }, [])

  if (people.length === 0 && apps.length === 0) return null

  return (
    <div className="w-[658px] max-h-[360px] overflow-y-auto bg-bg-elevated border border-border-default rounded-lg shadow-lg">
      <div className="p-2">
        {/* Section header */}
        {people.length > 0 && (
        <div className="flex items-center h-8 px-3 py-1">
          <span className="text-[12px] font-medium leading-none text-text-secondary">
            {isUrgent ? 'Urgent mention' : 'People'}
          </span>
        </div>
        )}

        {/* Rows */}
        {people.map((person, i) => (
          <div
            key={person.id}
            ref={i === highlight ? scrollRef : undefined}
            className={cn(
              'flex items-center gap-3 h-12 px-3 py-1.5 rounded-lg cursor-pointer transition-colors',
              i === highlight ? 'bg-bg-hover' : ''
            )}
            onMouseEnter={() => onHighlightChange(i)}
            onMouseDown={(e) => {
              e.preventDefault()
              onSelect(person)
            }}
          >
            <Avatar size={32} alt={person.name} />

            <div className="flex flex-col flex-1 min-w-0 gap-[2px] justify-center">
              <div className="text-[14px] font-normal leading-[1.4] text-text-primary truncate">
                {person.name}
              </div>
              <div className="text-[12px] leading-[1.2] text-text-secondary truncate">
                {person.role}
              </div>
            </div>

            {i === highlight && (
              <div className="flex items-center gap-2 shrink-0 text-text-muted">
                <span className="text-[12px] leading-[1.2]">↩</span>
                <span className="text-[9px] font-medium leading-[1.15]">Enter</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
