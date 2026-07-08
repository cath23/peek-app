/**
 * Merged huddle reads. Static TOPIC_HUDDLES + runtime stores (DM-promoted
 * huddles from the topic store, dialog/inline-created huddles from the
 * mutations layer), deletions filtered, seed-conversation body override
 * applied for the card preview.
 */
import { useTopicMutations } from '@/lib/topicMutations'
import { useTopicStore } from '@/lib/topicStore'
import type { Huddle } from './types'

/** Merged huddles for a topic. Function form so lists can call it per row. */
export function useHuddleLookup(): (topicId: string) => Huddle[] {
  const { getHuddlesForTopic } = useTopicStore()
  const { createdHuddles, deletedHuddleIds, huddleBodyOverrides } = useTopicMutations()
  return (topicId: string) =>
    [...getHuddlesForTopic(topicId), ...(createdHuddles[topicId] ?? [])]
      .filter((h) => !deletedHuddleIds.has(h.id))
      .map((h) => {
        if (!h.conversation) return h
        const override = huddleBodyOverrides[h.conversation.id]
        if (override) return { ...h, conversation: { ...h.conversation, body: override } }
        return h
      })
}

/** All huddles promoted from a given DM (there can be several). */
export function usePromotedHuddleLookup(): (dmId: number) => Huddle[] {
  const { findAllHuddlesByOriginDm } = useTopicStore()
  return findAllHuddlesByOriginDm
}
