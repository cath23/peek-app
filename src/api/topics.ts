/**
 * Topic reads + topic-level actions.
 *
 * Convex-backed when a deployment is configured; the mock-backed topicStore
 * serves everything otherwise. Transitional bridges while the remaining
 * entities are still mock-keyed:
 *   - Convex returns seedKeys as ids, so messages/huddles keep joining.
 *   - Seeded topics carry no topicMembers rows; their invitees come from the
 *     static mock list (the seed never wrote them — client-side join).
 *   - Topic creation double-writes: optimistic local store entry + Convex
 *     mutation sharing the same client-generated id; the merge dedupes when
 *     the reactive query catches up.
 */
import { useCallback } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { TOPICS as MOCK_TOPICS } from '@/data/topicData'
import { useTopicMutations } from '@/api/internal/topicMutations'
import { useTopicStore } from '@/api/internal/topicStore'
import { hasConvex } from './store'
import type { Topic } from './types'
import type { Person } from './types'

/** All topics. `undefined` while the Convex query is loading. */
export function useTopics(): Topic[] | undefined {
  const { topics: localTopics, extraTopics } = useTopicStore()
  const remote = useQuery(api.topics.list, hasConvex ? {} : 'skip')
  if (!hasConvex) return localTopics
  if (remote === undefined) return undefined
  const mapped: Topic[] = remote.map((t) => ({
    id: t.id,
    title: t.title,
    isResolved: false, // display resolution is derived via useIsTopicResolved
    invitees: t.memberNames.length
      ? t.memberNames
      : MOCK_TOPICS.find((m) => m.id === t.id)?.invitees,
  }))
  const ids = new Set(mapped.map((t) => t.id))
  return [...mapped, ...extraTopics.filter((t) => !ids.has(t.id))]
}

export function useTopicLookup(): (topicId: string) => Topic | undefined {
  const topics = useTopics()
  return useCallback((topicId: string) => topics?.find((t) => t.id === topicId), [topics])
}

/**
 * Derived topic resolution — THE source of truth for the dashed-circle vs
 * checkmark icon everywhere (topic list, header, Desk, huddle anchor,
 * promotion divider). Function form so lists can call it per row.
 */
export function useIsTopicResolved(): (topicId: string) => boolean {
  return useTopicMutations().isTopicResolved
}

export interface CreateTopicFromDmInput {
  title: string
  dmId: number
  dmName: string
  invitees: Person[]
  seedMessageId: string
}

export interface CreateTopicFromDmResult {
  topicId: string
  huddleId: string
  promotedAt: string
}

/** Promote a DM into the seed huddle of a freshly created topic. */
export function useCreateTopicFromDm(): (input: CreateTopicFromDmInput) => CreateTopicFromDmResult {
  const createLocal = useTopicStore().createTopicFromDm
  const createRemote = useMutation(api.topics.create)
  return useCallback(
    (input: CreateTopicFromDmInput) => {
      const result = createLocal(input)
      if (hasConvex) {
        void createRemote({
          title: input.title,
          seedKey: result.topicId,
          inviteeNames: input.invitees.map((p) => p.name),
        })
      }
      return result
    },
    [createLocal, createRemote],
  )
}
