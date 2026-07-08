import { createContext, useContext, useState, useMemo, useCallback, type ReactNode, type Dispatch, type SetStateAction } from 'react'
import { TOPIC_CONVERSATIONS, type ConversationData, type HighlightType, type ReactionData } from '@/data/topicData'
import type { Huddle } from '@/data/huddleData'
import type { ReplyData } from '@/data/replyData'

interface ResolvedOverride {
  resolved: boolean
  resolvedBy?: string
  message?: string
  /** When the resolution was triggered by a reply (compose `→ msg` from the thread panel),
   *  this holds that reply's id so we can surface and edit the resolution inline on that
   *  specific reply card. Undefined when the resolution came from the conv-level menu. */
  resolvedByReplyId?: string
}

/**
 * Holds runtime mutation state for topics. Lives at the app level so a topic's
 * sent messages, replies, resolutions, and other overrides survive when the
 * user navigates away (e.g. back to a DM via the huddle anchor) and returns.
 */
interface TopicMutationsValue {
  sentMessages: Record<string, ConversationData[]>
  setSentMessages: Dispatch<SetStateAction<Record<string, ConversationData[]>>>
  deletedIds: Set<string>
  setDeletedIds: Dispatch<SetStateAction<Set<string>>>
  resolvedOverrides: Record<string, ResolvedOverride>
  setResolvedOverrides: Dispatch<SetStateAction<Record<string, ResolvedOverride>>>
  sentReplies: Record<string, ReplyData[]>
  setSentReplies: Dispatch<SetStateAction<Record<string, ReplyData[]>>>
  bodyOverrides: Record<string, string>
  setBodyOverrides: Dispatch<SetStateAction<Record<string, string>>>
  highlightOverrides: Record<string, HighlightType | undefined>
  setHighlightOverrides: Dispatch<SetStateAction<Record<string, HighlightType | undefined>>>
  createdHuddles: Record<string, Huddle[]>
  setCreatedHuddles: Dispatch<SetStateAction<Record<string, Huddle[]>>>
  deletedHuddleIds: Set<string>
  setDeletedHuddleIds: Dispatch<SetStateAction<Set<string>>>
  huddleBodyOverrides: Record<string, string>
  setHuddleBodyOverrides: Dispatch<SetStateAction<Record<string, string>>>
  /** Top-level messages posted into a huddle from the V2 huddle main view, keyed by huddleId. */
  huddleSentMessages: Record<string, ConversationData[]>
  setHuddleSentMessages: Dispatch<SetStateAction<Record<string, ConversationData[]>>>
  reactionOverrides: Record<string, ReactionData[]>
  setReactionOverrides: Dispatch<SetStateAction<Record<string, ReactionData[]>>>
  /**
   * Derived: a topic is resolved when every non-deleted conversation in it is resolved
   * AND it has at least one such conversation. Single source of truth for the
   * dashed-circle vs checkmark icon shown across the app (topic list, topic header,
   * Desk page, "Huddle in <topic>" anchor, "Promoted to <topic>" divider, etc.).
   */
  isTopicResolved: (topicId: string) => boolean
}

const TopicMutationsContext = createContext<TopicMutationsValue | null>(null)

export function TopicMutationsProvider({ children }: { children: ReactNode }) {
  const [sentMessages, setSentMessages] = useState<Record<string, ConversationData[]>>({})
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [resolvedOverrides, setResolvedOverrides] = useState<Record<string, ResolvedOverride>>({})
  const [sentReplies, setSentReplies] = useState<Record<string, ReplyData[]>>({})
  const [bodyOverrides, setBodyOverrides] = useState<Record<string, string>>({})
  const [highlightOverrides, setHighlightOverrides] = useState<Record<string, HighlightType | undefined>>({})
  const [createdHuddles, setCreatedHuddles] = useState<Record<string, Huddle[]>>({})
  const [deletedHuddleIds, setDeletedHuddleIds] = useState<Set<string>>(new Set())
  const [huddleBodyOverrides, setHuddleBodyOverrides] = useState<Record<string, string>>({})
  const [huddleSentMessages, setHuddleSentMessages] = useState<Record<string, ConversationData[]>>({})
  const [reactionOverrides, setReactionOverrides] = useState<Record<string, ReactionData[]>>({})

  const isTopicResolved = useCallback(
    (topicId: string): boolean => {
      const staticConvs = (TOPIC_CONVERSATIONS[topicId] ?? []).flatMap((g) => g.convs)
      const sent = sentMessages[topicId] ?? []
      const allConvs = [...staticConvs, ...sent].filter((c) => !deletedIds.has(c.id))
      if (allConvs.length === 0) return false
      return allConvs.every((c) => resolvedOverrides[c.id]?.resolved ?? c.isResolved ?? false)
    },
    [sentMessages, deletedIds, resolvedOverrides],
  )

  const value = useMemo<TopicMutationsValue>(
    () => ({
      sentMessages,
      setSentMessages,
      deletedIds,
      setDeletedIds,
      resolvedOverrides,
      setResolvedOverrides,
      sentReplies,
      setSentReplies,
      bodyOverrides,
      setBodyOverrides,
      highlightOverrides,
      setHighlightOverrides,
      createdHuddles,
      setCreatedHuddles,
      deletedHuddleIds,
      setDeletedHuddleIds,
      huddleBodyOverrides,
      setHuddleBodyOverrides,
      huddleSentMessages,
      setHuddleSentMessages,
      reactionOverrides,
      setReactionOverrides,
      isTopicResolved,
    }),
    [sentMessages, deletedIds, resolvedOverrides, sentReplies, bodyOverrides, highlightOverrides, createdHuddles, deletedHuddleIds, huddleBodyOverrides, huddleSentMessages, reactionOverrides, isTopicResolved],
  )

  return <TopicMutationsContext.Provider value={value}>{children}</TopicMutationsContext.Provider>
}

export function useTopicMutations(): TopicMutationsValue {
  const ctx = useContext(TopicMutationsContext)
  if (!ctx) throw new Error('useTopicMutations must be used within TopicMutationsProvider')
  return ctx
}
