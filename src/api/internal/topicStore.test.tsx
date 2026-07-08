import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { TopicStoreProvider, useTopicStore } from './topicStore'
import { DM_CONVERSATIONS } from '@/data/dmData'

const wrapper = ({ children }: { children: ReactNode }) => (
  <TopicStoreProvider>{children}</TopicStoreProvider>
)

function setup() {
  return renderHook(() => useTopicStore(), { wrapper })
}

// First message in DM 1's conversations — used as a seed in promotion tests.
const DM1_FIRST = DM_CONVERSATIONS[1][0].convs[0]

describe('useTopicStore static lookups', () => {
  it('findTopic returns a known mock topic by id', () => {
    const { result } = setup()
    const topic = result.current.findTopic('1')
    expect(topic?.title).toBe('CI/CD pipeline stuck during build stage')
  })

  it('findTopic returns undefined for an unknown id', () => {
    const { result } = setup()
    expect(result.current.findTopic('made-up-id')).toBeUndefined()
  })

  it('getHuddlesForTopic merges static + runtime huddles for a topic', () => {
    const { result } = setup()
    // Topic 1 has a static huddle in TOPIC_HUDDLES; before any runtime add,
    // getHuddlesForTopic should return at least 1.
    const before = result.current.getHuddlesForTopic('1').length
    expect(before).toBeGreaterThan(0)

    act(() => {
      result.current.createTopicFromDm({
        title: 'Runtime huddle test',
        dmId: 1,
        dmName: 'Alice Johnson',
        invitees: [],
        seedMessageId: DM1_FIRST.id,
      })
    })
    // The new huddle is on a NEW topic, not topic 1, so topic 1 should be unchanged.
    expect(result.current.getHuddlesForTopic('1').length).toBe(before)
  })
})

describe('createTopicFromDm', () => {
  it('creates a new topic with the provided title and "You" + invitees as members', () => {
    const { result } = setup()
    let topicId = ''
    act(() => {
      const out = result.current.createTopicFromDm({
        title: 'My new topic',
        dmId: 1,
        dmName: 'Alice Johnson',
        invitees: [{ id: 'daniel', name: 'Daniel Stanton', role: 'Backend Engineer' }],
        seedMessageId: DM1_FIRST.id,
      })
      topicId = out.topicId
    })
    const topic = result.current.findTopic(topicId)
    expect(topic).toBeDefined()
    expect(topic!.title).toBe('My new topic')
    expect(topic!.invitees).toEqual(['You', 'Daniel Stanton'])
    expect(topic!.isResolved).toBe(false)
  })

  it('creates a huddle with originDmId, seedMessageId, promotedAt, promotedAtMs set', () => {
    const { result } = setup()
    let topicId = ''
    let huddleId = ''
    act(() => {
      const out = result.current.createTopicFromDm({
        title: 'T',
        dmId: 1,
        dmName: 'Alice Johnson',
        invitees: [],
        seedMessageId: DM1_FIRST.id,
      })
      topicId = out.topicId
      huddleId = out.huddleId
    })
    const huddles = result.current.getHuddlesForTopic(topicId)
    expect(huddles).toHaveLength(1)
    const h = huddles[0]
    expect(h.id).toBe(huddleId)
    expect(h.originDmId).toBe(1)
    expect(h.seedMessageId).toBe(DM1_FIRST.id)
    expect(typeof h.promotedAt).toBe('string')
    expect(h.promotedAt!.length).toBeGreaterThan(0)
    expect(typeof h.promotedAtMs).toBe('number')
    expect(h.promotedAtMs).toBeGreaterThan(0)
  })

  it('huddle preview body equals the SEED message body, not just the latest DM message', () => {
    const { result } = setup()
    let huddleId = ''
    act(() => {
      const out = result.current.createTopicFromDm({
        title: 'T',
        dmId: 1,
        dmName: 'Alice Johnson',
        invitees: [],
        seedMessageId: DM1_FIRST.id,
      })
      huddleId = out.huddleId
    })
    const huddle = result.current.findHuddleByOriginDm(1)
    expect(huddle).toBeDefined()
    expect(huddle!.id).toBe(huddleId)
    expect(huddle!.conversation!.body).toBe(DM1_FIRST.body)
  })

  it('returned {topicId, huddleId, promotedAt} matches the inserted record', () => {
    const { result } = setup()
    let returned: { topicId: string; huddleId: string; promotedAt: string } | undefined
    act(() => {
      returned = result.current.createTopicFromDm({
        title: 'T',
        dmId: 1,
        dmName: 'Alice Johnson',
        invitees: [],
        seedMessageId: DM1_FIRST.id,
      })
    })
    expect(returned).toBeDefined()
    const huddle = result.current.findHuddleByOriginDm(1)
    expect(huddle!.id).toBe(returned!.huddleId)
    expect(huddle!.promotedAt).toBe(returned!.promotedAt)
    expect(huddle!.topicId).toBe(returned!.topicId)
  })

  it('two promotions of the same DM produce two distinct huddles, both findable', () => {
    const { result } = setup()
    let h1 = ''
    let h2 = ''
    act(() => {
      h1 = result.current.createTopicFromDm({
        title: 'First',
        dmId: 1,
        dmName: 'Alice Johnson',
        invitees: [],
        seedMessageId: DM1_FIRST.id,
      }).huddleId
      h2 = result.current.createTopicFromDm({
        title: 'Second',
        dmId: 1,
        dmName: 'Alice Johnson',
        invitees: [],
        seedMessageId: DM_CONVERSATIONS[1][0].convs[1].id, // different seed
      }).huddleId
    })
    expect(h1).not.toBe(h2)
    const all = result.current.findAllHuddlesByOriginDm(1)
    const runtimeIds = all.map((h) => h.id).filter((id) => id === h1 || id === h2)
    expect(runtimeIds).toContain(h1)
    expect(runtimeIds).toContain(h2)
  })
})

describe('findHuddleByOriginDm / findAllHuddlesByOriginDm', () => {
  it('findHuddleByOriginDm returns undefined when no huddle for that DM', () => {
    const { result } = setup()
    // DM id 999 doesn't exist; no static or runtime huddle.
    expect(result.current.findHuddleByOriginDm(999)).toBeUndefined()
  })

  it('findAllHuddlesByOriginDm returns [] when nothing matches', () => {
    const { result } = setup()
    expect(result.current.findAllHuddlesByOriginDm(999)).toEqual([])
  })

  it('after createTopicFromDm, findHuddleByOriginDm finds the runtime huddle', () => {
    const { result } = setup()
    expect(result.current.findHuddleByOriginDm(1)).toBeUndefined()
    act(() => {
      result.current.createTopicFromDm({
        title: 'T',
        dmId: 1,
        dmName: 'Alice Johnson',
        invitees: [],
        seedMessageId: DM1_FIRST.id,
      })
    })
    const found = result.current.findHuddleByOriginDm(1)
    expect(found).toBeDefined()
    expect(found!.originDmId).toBe(1)
  })
})
