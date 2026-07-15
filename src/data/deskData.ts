import type { TopicStateStatus } from '@/components/ui/TopicState'

export type OpenWorkItem =
  | {
      id: string
      kind?: 'topic'
      topicId: string
      title: string
      topicStatus: TopicStateStatus
      isUnread?: boolean
    }
  | {
      id: string
      kind: 'dm'
      dmId: string
      name: string
      avatarSrc?: string
      isUnread?: boolean
    }

export type UrgentItem =
  | {
      id: string
      kind: 'dm'
      dmId: string
      name: string
      avatarSrc?: string
    }
  | {
      id: string
      kind: 'topic'
      topicId: string
      title: string
      topicStatus: TopicStateStatus
    }

export type StarredEntry =
  | {
      id: string
      kind: 'dm'
      dmId: string
      name: string
      avatarSrc?: string
      isUnread?: boolean
    }
  | {
      id: string
      kind: 'topic'
      topicId: string
      title: string
      topicStatus: TopicStateStatus
      isUnread?: boolean
    }

export const URGENT_ITEMS: UrgentItem[] = [
  { id: 'urg_1', kind: 'dm', dmId: 'daniel', name: 'Daniel Stanton' },
  { id: 'urg_2', kind: 'dm', dmId: 'hallie', name: 'Hallie Pratt' },
]

export const OPEN_WORK_ITEMS: OpenWorkItem[] = [
  {
    id: 'ow_1',
    topicId: '2',
    title: 'Launch checklist for v2 of the mobile app',
    topicStatus: 'unresolved',
  },
  {
    id: 'ow_2',
    topicId: '3',
    title: 'Ongoing onboarding issues',
    topicStatus: 'unresolved',
  },
]

export const STARRED_ENTRIES: StarredEntry[] = [
  { id: 'star_1', kind: 'dm', dmId: 'greg', name: 'Greg Bothman' },
  { id: 'star_2', kind: 'dm', dmId: 'juan', name: 'Juan Foley' },
  {
    id: 'star_3',
    kind: 'topic',
    topicId: '1',
    title: 'CI/CD pipeline stuck during build stage',
    topicStatus: 'unresolved',
  },
]
