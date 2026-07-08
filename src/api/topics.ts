/**
 * Topic reads + topic-level actions.
 */
import { useTopicMutations } from '@/api/internal/topicMutations'
import { useTopicStore } from '@/api/internal/topicStore'
import type { Topic } from './types'
import type { Person } from './types'

export function useTopics(): Topic[] {
  return useTopicStore().topics
}

export function useTopicLookup(): (topicId: string) => Topic | undefined {
  return useTopicStore().findTopic
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
  return useTopicStore().createTopicFromDm
}
