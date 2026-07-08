import { type ReactNode } from 'react'
import { IconLock } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

export type TopicTab = 'conversations' | 'timeline' | 'huddles'

interface TabDef {
  id: TopicTab
  label: string
  icon?: ReactNode
}

interface TopicTabsProps {
  activeTab: TopicTab
  onTabChange: (tab: TopicTab) => void
  tabs?: TabDef[]
  className?: string
}

const DEFAULT_TABS: TabDef[] = [
  { id: 'conversations', label: 'Conversations' },
  { id: 'huddles', label: 'Huddles', icon: <IconLock size={16} stroke={1.5} /> },
  { id: 'timeline', label: 'Timeline' },
]

export function TopicTabs({
  activeTab,
  onTabChange,
  tabs = DEFAULT_TABS,
  className,
}: TopicTabsProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition-colors',
            activeTab === tab.id
              ? 'bg-accent-muted text-text-primary'
              : 'text-text-secondary hover:bg-bg-hover'
          )}
          style={{ fontSize: 12, lineHeight: '120%', fontWeight: 400 }}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
