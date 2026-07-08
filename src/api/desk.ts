/**
 * Desk + Screener reads.
 *
 * Phase 2: screener items and open work become per-user tables
 * (domain model §2.12–2.13); the urgent list becomes fully derived (§4.4).
 * Dismiss/snooze state is page-local today and moves into the seam when
 * those tables land.
 */
import { SCREENER_ITEMS } from '@/data/screenerData'
import { OPEN_WORK_ITEMS, URGENT_ITEMS } from '@/data/deskData'
import type { ScreenerItem, OpenWorkItem, UrgentItem } from './types'

export function useScreenerItems(): ScreenerItem[] {
  return SCREENER_ITEMS
}

export function useDeskItems(): { openWork: OpenWorkItem[]; urgent: UrgentItem[] } {
  return { openWork: OPEN_WORK_ITEMS, urgent: URGENT_ITEMS }
}
