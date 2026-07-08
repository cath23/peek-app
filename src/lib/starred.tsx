import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import { STARRED_ENTRIES, type StarredEntry } from '@/data/deskData'
import type { TopicStateStatus } from '@/components/ui/TopicState'

const entryLabel = (e: StarredEntry) => (e.kind === 'dm' ? e.name : e.title)

interface StarDmInput {
  dmId: number
  name: string
  avatarSrc?: string
}

interface StarTopicInput {
  topicId: string
  title: string
  topicStatus: TopicStateStatus
}

interface StarredContextValue {
  entries: StarredEntry[]
  isDmStarred: (dmId: number) => boolean
  isTopicStarred: (topicId: string) => boolean
  toggleDm: (input: StarDmInput) => void
  toggleTopic: (input: StarTopicInput) => void
}

const StarredContext = createContext<StarredContextValue | null>(null)

export function StarredProvider({ children }: { children: ReactNode }) {
  const [rawEntries, setEntries] = useState<StarredEntry[]>(STARRED_ENTRIES)

  const entries = useMemo(
    () => [...rawEntries].sort((a, b) => entryLabel(a).localeCompare(entryLabel(b), undefined, { sensitivity: 'base' })),
    [rawEntries],
  )

  const isDmStarred = useCallback(
    (dmId: number) => rawEntries.some((e) => e.kind === 'dm' && e.dmId === dmId),
    [rawEntries],
  )

  const isTopicStarred = useCallback(
    (topicId: string) => rawEntries.some((e) => e.kind === 'topic' && e.topicId === topicId),
    [rawEntries],
  )

  const toggleDm = useCallback(({ dmId, name, avatarSrc }: StarDmInput) => {
    setEntries((prev) => {
      const exists = prev.some((e) => e.kind === 'dm' && e.dmId === dmId)
      if (exists) return prev.filter((e) => !(e.kind === 'dm' && e.dmId === dmId))
      return [...prev, { id: `star_dm_${dmId}`, kind: 'dm', dmId, name, avatarSrc }]
    })
  }, [])

  const toggleTopic = useCallback(({ topicId, title, topicStatus }: StarTopicInput) => {
    setEntries((prev) => {
      const exists = prev.some((e) => e.kind === 'topic' && e.topicId === topicId)
      if (exists) return prev.filter((e) => !(e.kind === 'topic' && e.topicId === topicId))
      return [...prev, { id: `star_topic_${topicId}`, kind: 'topic', topicId, title, topicStatus }]
    })
  }, [])

  return (
    <StarredContext.Provider value={{ entries, isDmStarred, isTopicStarred, toggleDm, toggleTopic }}>
      {children}
    </StarredContext.Provider>
  )
}

export function useStarred() {
  const ctx = useContext(StarredContext)
  if (!ctx) throw new Error('useStarred must be used inside StarredProvider')
  return ctx
}
