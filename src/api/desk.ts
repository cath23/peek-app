/**
 * Desk + Screener reads.
 *
 * Convex-backed when a deployment is configured: per-user tables for
 * screener items and open work (domain model §2.12–2.13), and the urgent
 * list fully derived server-side (§4.4 — urgent message or an unread reply
 * on one, newer than the readState watermark). Static mocks otherwise.
 * Avatars stay client-side name-keyed until Phase 3.
 */
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SCREENER_ITEMS } from '@/data/screenerData'
import { OPEN_WORK_ITEMS, URGENT_ITEMS } from '@/data/deskData'
import { avatarFor } from '@/data/peopleData'
import { hasConvex } from './store'
import type { ScreenerItem, OpenWorkItem, UrgentItem } from './types'

export function useScreenerItems(): ScreenerItem[] {
  const remote = useQuery(api.desk.screenerList, hasConvex ? {} : 'skip')
  if (!hasConvex) return SCREENER_ITEMS
  return (remote ?? []).map((i) =>
    i.kind === 'dm' ? { ...i, authorAvatarSrc: avatarFor(i.authorName) } : i,
  )
}

export function useDeskItems(): { openWork: OpenWorkItem[]; urgent: UrgentItem[] } {
  const openWork = useQuery(api.desk.openWorkList, hasConvex ? {} : 'skip')
  const urgent = useQuery(api.desk.urgentList, hasConvex ? {} : 'skip')
  if (!hasConvex) return { openWork: OPEN_WORK_ITEMS, urgent: URGENT_ITEMS }
  return {
    openWork: openWork ?? [],
    urgent: (urgent ?? []).map((u) => (u.kind === 'dm' ? { ...u, avatarSrc: avatarFor(u.name) } : u)),
  }
}

/** True while any Desk list query is in flight (drives the sidebar skeleton). */
export function useDeskLoading(): boolean {
  const screener = useQuery(api.desk.screenerList, hasConvex ? {} : 'skip')
  const openWork = useQuery(api.desk.openWorkList, hasConvex ? {} : 'skip')
  const urgent = useQuery(api.desk.urgentList, hasConvex ? {} : 'skip')
  return hasConvex && (screener === undefined || openWork === undefined || urgent === undefined)
}
