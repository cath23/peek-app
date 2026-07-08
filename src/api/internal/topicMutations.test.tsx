import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { TopicMutationsProvider, useTopicMutations } from './topicMutations'
import { TOPIC_CONVERSATIONS, type ConversationData } from '@/data/topicData'

const wrapper = ({ children }: { children: ReactNode }) => (
  <TopicMutationsProvider>{children}</TopicMutationsProvider>
)

function setup() {
  return renderHook(() => useTopicMutations(), { wrapper })
}

// All conv ids in topic '1' (mostly unresolved in mock data).
const TOPIC_1_CONV_IDS = (TOPIC_CONVERSATIONS['1'] ?? [])
  .flatMap((g) => g.convs)
  .map((c) => c.id)

const TOPIC_4_CONV_IDS = (TOPIC_CONVERSATIONS['4'] ?? [])
  .flatMap((g) => g.convs)
  .map((c) => c.id)

describe('isTopicResolved', () => {
  it('returns false for a topic with unresolved static convs', () => {
    const { result } = setup()
    expect(result.current.isTopicResolved('1')).toBe(false)
  })

  it('returns true for topic 4 (all static convs resolved in mock data)', () => {
    const { result } = setup()
    expect(result.current.isTopicResolved('4')).toBe(true)
  })

  it('returns false for an unknown topic id (no convs)', () => {
    const { result } = setup()
    expect(result.current.isTopicResolved('this-topic-does-not-exist')).toBe(false)
  })

  it('flips to true once resolvedOverrides cover every conv in topic 1', () => {
    const { result } = setup()
    expect(result.current.isTopicResolved('1')).toBe(false)
    act(() => {
      result.current.setResolvedOverrides((prev) => {
        const next = { ...prev }
        for (const id of TOPIC_1_CONV_IDS) {
          next[id] = { resolved: true, resolvedBy: 'You' }
        }
        return next
      })
    })
    expect(result.current.isTopicResolved('1')).toBe(true)
  })

  it('adding an unresolved sentMessage to a fully-resolved topic flips it back to false', () => {
    const { result } = setup()
    expect(result.current.isTopicResolved('4')).toBe(true)
    const newMsg: ConversationData = {
      id: 'sent_runtime_1',
      authorName: 'You',
      timestamp: '12:00 PM',
      body: 'fresh thought',
    }
    act(() => {
      result.current.setSentMessages((prev) => ({ ...prev, '4': [...(prev['4'] ?? []), newMsg] }))
    })
    expect(result.current.isTopicResolved('4')).toBe(false)
  })

  it('resolving the new sent message brings it back to true', () => {
    const { result } = setup()
    const newMsg: ConversationData = {
      id: 'sent_runtime_2',
      authorName: 'You',
      timestamp: '12:00 PM',
      body: 'fresh thought',
    }
    act(() => {
      result.current.setSentMessages((prev) => ({ ...prev, '4': [...(prev['4'] ?? []), newMsg] }))
    })
    expect(result.current.isTopicResolved('4')).toBe(false)
    act(() => {
      result.current.setResolvedOverrides((prev) => ({
        ...prev,
        sent_runtime_2: { resolved: true, resolvedBy: 'You' },
      }))
    })
    expect(result.current.isTopicResolved('4')).toBe(true)
  })

  it('deleting the LAST unresolved conv in topic 1 flips it to true (assuming the rest were resolved)', () => {
    const { result } = setup()
    // Resolve everything except the last conv, then delete the last conv.
    const allButLast = TOPIC_1_CONV_IDS.slice(0, -1)
    const lastId = TOPIC_1_CONV_IDS[TOPIC_1_CONV_IDS.length - 1]
    act(() => {
      result.current.setResolvedOverrides((prev) => {
        const next = { ...prev }
        for (const id of allButLast) next[id] = { resolved: true, resolvedBy: 'You' }
        return next
      })
    })
    expect(result.current.isTopicResolved('1')).toBe(false)
    act(() => {
      result.current.setDeletedIds((prev) => new Set([...prev, lastId]))
    })
    expect(result.current.isTopicResolved('1')).toBe(true)
  })

  it('deleting ALL convs in a fully-resolved topic returns false (no convs left)', () => {
    const { result } = setup()
    expect(result.current.isTopicResolved('4')).toBe(true)
    act(() => {
      result.current.setDeletedIds((prev) => new Set([...prev, ...TOPIC_4_CONV_IDS]))
    })
    expect(result.current.isTopicResolved('4')).toBe(false)
  })

  it('reaction and highlight mutations do not affect isTopicResolved', () => {
    const { result } = setup()
    const before = result.current.isTopicResolved('1')
    act(() => {
      result.current.setReactionOverrides((prev) => ({ ...prev, [TOPIC_1_CONV_IDS[0]]: [{ emoji: '🚀', count: 1, owner: 'yours' }] }))
      result.current.setHighlightOverrides((prev) => ({ ...prev, [TOPIC_1_CONV_IDS[0]]: 'insight' }))
    })
    expect(result.current.isTopicResolved('1')).toBe(before)
  })
})
