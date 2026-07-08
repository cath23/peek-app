import { describe, it, expect } from 'vitest'
import {
  isLondonBst,
  londonWallToUtc,
  londonCalendarDate,
  parseClock,
  resolveDateLabel,
  dayTimeToUtc,
} from './seedDates'

// Anchor: 2026-07-08 12:00 Europe/London (BST) — the plan's writing date.
const ANCHOR = Date.UTC(2026, 6, 8, 11, 0)

describe('London BST window', () => {
  it('is GMT in winter, BST in summer', () => {
    expect(isLondonBst(Date.UTC(2024, 0, 15))).toBe(false)
    expect(isLondonBst(Date.UTC(2024, 6, 15))).toBe(true)
  })
  it('switches on the last Sundays of March and October (2024: Mar 31 / Oct 27)', () => {
    expect(isLondonBst(Date.UTC(2024, 2, 31, 0, 59))).toBe(false)
    expect(isLondonBst(Date.UTC(2024, 2, 31, 1, 1))).toBe(true)
    expect(isLondonBst(Date.UTC(2024, 9, 27, 0, 59))).toBe(true)
    expect(isLondonBst(Date.UTC(2024, 9, 27, 1, 1))).toBe(false)
  })
})

describe('wall-clock conversion', () => {
  it('9:14 AM London on 2024-09-02 (BST) is 08:14 UTC', () => {
    expect(londonWallToUtc(2024, 8, 2, 9, 14)).toBe(Date.UTC(2024, 8, 2, 8, 14))
  })
  it('11:00 AM London on 2024-07-16 → calendar date round-trips', () => {
    const utc = londonWallToUtc(2024, 6, 16, 11, 0)
    const cal = londonCalendarDate(utc)
    expect([cal.y, cal.m0, cal.d, cal.weekday]).toEqual([2024, 6, 16, 2]) // Tuesday
  })
})

describe('clock labels', () => {
  it('parses AM/PM including the noon/midnight edge', () => {
    expect(parseClock('9:14 AM')).toEqual({ hh: 9, mm: 14 })
    expect(parseClock('12:05 PM')).toEqual({ hh: 12, mm: 5 })
    expect(parseClock('12:30 AM')).toEqual({ hh: 0, mm: 30 })
    expect(parseClock('4:30 PM')).toEqual({ hh: 16, mm: 30 })
  })
})

describe('date-label resolution (domain model §5)', () => {
  // The per-label year rule: everything lands in 2024 except 'Mon, August 18'
  // (a Sunday in 2024), which must land on Monday 2025-08-18.
  const cases: Array<[string, [number, number, number]]> = [
    ['Mon, September 2', [2024, 8, 2]],
    ['Tue, September 3', [2024, 8, 3]],
    ['Wed, August 28', [2024, 7, 28]],
    ['Mon, August 18', [2025, 7, 18]],
    ['Tue, July 16', [2024, 6, 16]],
    ['Thu, August 8', [2024, 7, 8]],
    ['Fri, August 23', [2024, 7, 23]],
    ['Mon, August 26', [2024, 7, 26]],
    ['Mon, September 9', [2024, 8, 9]],
    ['Thu, September 5', [2024, 8, 5]],
  ]
  it.each(cases)('%s', (label, [y, m0, d]) => {
    expect(resolveDateLabel(label, ANCHOR)).toEqual({ y, m0, d })
  })

  it('resolves Today/Yesterday relative to the anchor (London day)', () => {
    expect(resolveDateLabel('Today', ANCHOR)).toEqual({ y: 2026, m0: 6, d: 8 })
    expect(resolveDateLabel('Yesterday', ANCHOR)).toEqual({ y: 2026, m0: 6, d: 7 })
  })

  it('combines day + clock into UTC ms', () => {
    const day = resolveDateLabel('Mon, September 2', ANCHOR)
    expect(dayTimeToUtc(day, '9:14 AM')).toBe(Date.UTC(2024, 8, 2, 8, 14))
  })

  it('rejects labels it cannot honor', () => {
    expect(() => resolveDateLabel('Someday, Maybe 32', ANCHOR)).toThrow()
  })
})
