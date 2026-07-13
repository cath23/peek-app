/**
 * Topic reads + topic-level actions.
 *
 * Convex-backed when a deployment is configured; the mock-backed topicStore
 * serves everything otherwise (tests, Storybook, checkouts without a
 * deployment). Convex returns stable seedKeys as ids (demo-seed ids +
 * client-generated ids), so demo data joins exactly like the mocks. Topic
 * creation double-writes: optimistic local store entry + Convex mutation
 * sharing the same client-generated id; the merge dedupes when the reactive
 * query catches up.
 */
import { useCallback } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useTopicMutations } from '@/api/internal/topicMutations'
import { CURRENT_USER_NAME, useCurrentUser } from './currentUser'
import { useTopicStore } from '@/api/internal/topicStore'
import { hasConvex } from './store'
import type { Topic } from './types'
import type { Person } from './types'

/** All topics. `undefined` while the Convex query is loading. */
export function useTopics(): Topic[] | undefined {
  const { topics: localTopics, extraTopics } = useTopicStore()
  const me = useCurrentUser()
  const remote = useQuery(api.topics.list, hasConvex ? {} : 'skip')
  if (!hasConvex) return localTopics
  if (remote === undefined || me === undefined) return undefined
  const mapped: Topic[] = remote.map((t) => ({
    id: t.id,
    title: t.title,
    isResolved: t.isResolved, // server-derived (§4.1); surfaced via useIsTopicResolved
    invitees: t.memberNames.length
      ? t.memberNames.map((n, i) => (t.memberIds[i] === me.id ? CURRENT_USER_NAME : n))
      : undefined,
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
 * Convex mode reads the server-derived value from topics.list (resolution
 * writes double-write, so the reactive query keeps it current); mock mode
 * keeps the override-layer computation.
 */
export function useIsTopicResolved(): (topicId: string) => boolean {
  const localIsResolved = useTopicMutations().isTopicResolved
  const topics = useTopics()
  return useCallback(
    (topicId: string) => {
      if (!hasConvex) return localIsResolved(topicId)
      return topics?.find((t) => t.id === topicId)?.isResolved ?? false
    },
    [localIsResolved, topics],
  )
}

export interface CreateTopicFromDmInput {
  title: string
  dmId: string
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
  const createHuddleFromDmRemote = useMutation(api.huddles.createFromDm)
  return useCallback(
    (input: CreateTopicFromDmInput) => {
      const result = createLocal(input)
      if (hasConvex) {
        // Sequenced: the huddle resolves its topic by the shared seedKey,
        // so the topic must exist first.
        void (async () => {
          await createRemote({
            title: input.title,
            seedKey: result.topicId,
            inviteeNames: input.invitees.map((p) => p.name),
          })
          await createHuddleFromDmRemote({
            topicKey: result.topicId,
            seedKey: result.huddleId,
            originDmKey: String(input.dmId),
            seedMessageKey: input.seedMessageId,
            memberNames: [input.dmName],
          })
        })()
      }
      return result
    },
    [createLocal, createRemote, createHuddleFromDmRemote],
  )
}
