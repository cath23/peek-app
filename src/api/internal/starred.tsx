import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { STARRED_ENTRIES, type StarredEntry } from '@/data/deskData'
import { useAvatarSrc } from '@/api/avatars'
import { hasConvex } from '@/api/store'
import type { TopicStateStatus } from '@/components/ui/TopicState'

const entryLabel = (e: StarredEntry) => (e.kind === 'dm' ? e.name : e.title)
const entryKey = (e: StarredEntry) => (e.kind === 'dm' ? `dm:${e.dmId}` : `topic:${e.topicId}`)

interface StarDmInput {
  dmId: string
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
  isDmStarred: (dmId: string) => boolean
  isTopicStarred: (topicId: string) => boolean
  toggleDm: (input: StarDmInput) => void
  toggleTopic: (input: StarTopicInput) => void
  /** True while the Convex stars query is in flight. */
  isLoading: boolean
}

const StarredContext = createContext<StarredContextValue | null>(null)

export function StarredProvider({ children }: { children: ReactNode }) {
  const avatarSrcFor = useAvatarSrc()
  // Mock-mode state (full source of truth without a deployment).
  const [mockEntries, setMockEntries] = useState<StarredEntry[]>(STARRED_ENTRIES)
  // Convex-mode optimistic overlay: session toggles applied over the query
  // until it catches up (starred=true carries the entry to render meanwhile).
  const [pending, setPending] = useState<Map<string, { starred: boolean; entry?: StarredEntry }>>(new Map())
  const remote = useQuery(api.desk.starsList, hasConvex ? {} : 'skip')
  const toggleRemote = useMutation(api.desk.toggleStar)

  const rawEntries = useMemo<StarredEntry[]>(() => {
    if (!hasConvex) return mockEntries
    const base: StarredEntry[] = (remote ?? []).map((e) =>
      e.kind === 'dm' ? { ...e, avatarSrc: avatarSrcFor(e.name) } : e,
    )
    const baseKeys = new Set(base.map(entryKey))
    const kept = base.filter((e) => pending.get(entryKey(e))?.starred !== false)
    const added = [...pending.values()]
      .filter((p) => p.starred && p.entry && !baseKeys.has(entryKey(p.entry)))
      .map((p) => p.entry!)
    return [...kept, ...added]
  }, [mockEntries, remote, pending, avatarSrcFor])

  const entries = useMemo(
    () => [...rawEntries].sort((a, b) => entryLabel(a).localeCompare(entryLabel(b), undefined, { sensitivity: 'base' })),
    [rawEntries],
  )

  const isDmStarred = useCallback(
    (dmId: string) => rawEntries.some((e) => e.kind === 'dm' && e.dmId === dmId),
    [rawEntries],
  )

  const isTopicStarred = useCallback(
    (topicId: string) => rawEntries.some((e) => e.kind === 'topic' && e.topicId === topicId),
    [rawEntries],
  )

  const toggleDm = useCallback(({ dmId, name, avatarSrc }: StarDmInput) => {
    if (!hasConvex) {
      setMockEntries((prev) => {
        const exists = prev.some((e) => e.kind === 'dm' && e.dmId === dmId)
        if (exists) return prev.filter((e) => !(e.kind === 'dm' && e.dmId === dmId))
        return [...prev, { id: `star_dm_${dmId}`, kind: 'dm', dmId, name, avatarSrc }]
      })
      return
    }
    const key = `dm:${dmId}`
    const currentlyStarred = rawEntries.some((e) => e.kind === 'dm' && e.dmId === dmId)
    setPending((prev) => {
      const next = new Map(prev)
      next.set(key, {
        starred: !currentlyStarred,
        entry: { id: `star_dm_${dmId}`, kind: 'dm', dmId, name, avatarSrc: avatarSrc ?? avatarSrcFor(name) },
      })
      return next
    })
    void toggleRemote({ kind: 'dm', targetKey: dmId })
  }, [rawEntries, toggleRemote, avatarSrcFor])

  const toggleTopic = useCallback(({ topicId, title, topicStatus }: StarTopicInput) => {
    if (!hasConvex) {
      setMockEntries((prev) => {
        const exists = prev.some((e) => e.kind === 'topic' && e.topicId === topicId)
        if (exists) return prev.filter((e) => !(e.kind === 'topic' && e.topicId === topicId))
        return [...prev, { id: `star_topic_${topicId}`, kind: 'topic', topicId, title, topicStatus }]
      })
      return
    }
    const key = `topic:${topicId}`
    const currentlyStarred = rawEntries.some((e) => e.kind === 'topic' && e.topicId === topicId)
    setPending((prev) => {
      const next = new Map(prev)
      next.set(key, {
        starred: !currentlyStarred,
        entry: { id: `star_topic_${topicId}`, kind: 'topic', topicId, title, topicStatus },
      })
      return next
    })
    void toggleRemote({ kind: 'topic', targetKey: topicId })
  }, [rawEntries, toggleRemote])

  const isLoading = hasConvex && remote === undefined

  return (
    <StarredContext.Provider value={{ entries, isDmStarred, isTopicStarred, toggleDm, toggleTopic, isLoading }}>
      {children}
    </StarredContext.Provider>
  )
}

export function useStarred() {
  const ctx = useContext(StarredContext)
  if (!ctx) throw new Error('useStarred must be used inside StarredProvider')
  return ctx
}
