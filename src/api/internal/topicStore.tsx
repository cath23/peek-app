import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import { TOPICS, type Topic, type ConversationData } from '@/data/topicData'
import { TOPIC_HUDDLES, type Huddle } from '@/data/huddleData'
import { DM_CONVERSATIONS } from '@/data/dmData'
import type { Person } from '@/data/peopleData'

interface CreateTopicFromDmInput {
  title: string
  dmId: number
  dmName: string
  invitees: Person[]
  /** The DM message id that triggered the promotion. Used to render the huddle anchor above this specific message. */
  seedMessageId: string
}

interface CreateTopicFromDmResult {
  topicId: string
  huddleId: string
  promotedAt: string
}

interface TopicStoreValue {
  /** All topics (static + runtime). */
  topics: Topic[]
  /** Resolve huddles for a topic (static + runtime). */
  getHuddlesForTopic: (topicId: string) => Huddle[]
  /** Look up a topic by id. */
  findTopic: (topicId: string) => Topic | undefined
  /** Find the huddle that was promoted from the given DM (searches static + runtime). Returns the first match if multiple exist. */
  findHuddleByOriginDm: (dmId: number) => Huddle | undefined
  /** Find every huddle that was promoted from the given DM (searches static + runtime). */
  findAllHuddlesByOriginDm: (dmId: number) => Huddle[]
  /** Promote a DM into the first huddle of a freshly created topic. Returns the new topic id. */
  createTopicFromDm: (input: CreateTopicFromDmInput) => CreateTopicFromDmResult
}

const TopicStoreContext = createContext<TopicStoreValue | null>(null)

let topicSeq = 0
function nextTopicId() {
  return `t_${Date.now()}_${++topicSeq}`
}

let huddleSeq = 0
function nextHuddleId() {
  return `h_${Date.now()}_${++huddleSeq}`
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatPromotedAt(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

function formatLastActivity(d: Date): string {
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

function formatTime(d: Date): string {
  const hh = d.getHours()
  const mm = d.getMinutes()
  const ampm = hh >= 12 ? 'PM' : 'AM'
  const h12 = hh % 12 || 12
  return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`
}

function findDmMessageById(dmId: number, messageId: string): ConversationData | undefined {
  const groups = DM_CONVERSATIONS[dmId]
  if (!groups) return undefined
  for (const g of groups) {
    const found = g.convs.find((c) => c.id === messageId)
    if (found) return found
  }
  return undefined
}

export function TopicStoreProvider({ children }: { children: ReactNode }) {
  const [extraTopics, setExtraTopics] = useState<Topic[]>([])
  const [extraHuddles, setExtraHuddles] = useState<Record<string, Huddle[]>>({})

  const topics = useMemo(() => [...TOPICS, ...extraTopics], [extraTopics])

  const findTopic = useCallback(
    (topicId: string) => topics.find((t) => t.id === topicId),
    [topics],
  )

  const getHuddlesForTopic = useCallback(
    (topicId: string) => [...(TOPIC_HUDDLES[topicId] ?? []), ...(extraHuddles[topicId] ?? [])],
    [extraHuddles],
  )

  const findAllHuddlesByOriginDm = useCallback(
    (dmId: number): Huddle[] => {
      const result: Huddle[] = []
      for (const huddles of Object.values(extraHuddles)) {
        for (const h of huddles) {
          if (h.originDmId === dmId) result.push(h)
        }
      }
      for (const huddles of Object.values(TOPIC_HUDDLES)) {
        for (const h of huddles) {
          if (h.originDmId === dmId) result.push(h)
        }
      }
      return result
    },
    [extraHuddles],
  )

  const findHuddleByOriginDm = useCallback(
    (dmId: number): Huddle | undefined => findAllHuddlesByOriginDm(dmId)[0],
    [findAllHuddlesByOriginDm],
  )

  const createTopicFromDm = useCallback(
    ({ title, dmId, dmName, invitees, seedMessageId }: CreateTopicFromDmInput): CreateTopicFromDmResult => {
      const topicId = nextTopicId()
      const huddleId = nextHuddleId()
      const now = new Date()
      const promotedAt = formatPromotedAt(now)
      const lastActivity = formatLastActivity(now)

      const newTopic: Topic = {
        id: topicId,
        title,
        isResolved: false,
        invitees: ['You', ...invitees.map((p) => p.name)],
      }

      const huddleMembers = ['You', dmName]

      // Use the *seed* DM message (the one that triggered promotion) as the huddle
      // card preview, so the card represents the actual conversation being promoted
      // — not whatever happens to be the latest DM message at promotion time.
      const seedDm = findDmMessageById(dmId, seedMessageId)
      const previewConversation: ConversationData = seedDm ?? {
        id: `${huddleId}_origin`,
        authorName: 'You',
        timestamp: formatTime(now),
        body: 'No messages yet.',
        replyCount: 0,
      }

      const newHuddle: Huddle = {
        id: huddleId,
        topicId,
        members: huddleMembers,
        state: 'active',
        lastActivity,
        originDmId: dmId,
        promotedAt,
        promotedAtMs: now.getTime(),
        seedMessageId,
        conversation: previewConversation,
      }

      setExtraTopics((prev) => [...prev, newTopic])
      setExtraHuddles((prev) => ({ ...prev, [topicId]: [...(prev[topicId] ?? []), newHuddle] }))

      return { topicId, huddleId, promotedAt }
    },
    [],
  )

  const value = useMemo<TopicStoreValue>(
    () => ({ topics, getHuddlesForTopic, findTopic, findHuddleByOriginDm, findAllHuddlesByOriginDm, createTopicFromDm }),
    [topics, getHuddlesForTopic, findTopic, findHuddleByOriginDm, findAllHuddlesByOriginDm, createTopicFromDm],
  )

  return <TopicStoreContext.Provider value={value}>{children}</TopicStoreContext.Provider>
}

export function useTopicStore(): TopicStoreValue {
  const ctx = useContext(TopicStoreContext)
  if (!ctx) throw new Error('useTopicStore must be used within TopicStoreProvider')
  return ctx
}
