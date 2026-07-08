/**
 * Europe/London calendar math for the demo fixture (domain model §5).
 *
 * Pure arithmetic — no Intl timezone data, which the Convex runtime does not
 * guarantee. London is UTC+0 (GMT) except during British Summer Time:
 * from the last Sunday of March 01:00 UTC to the last Sunday of October
 * 01:00 UTC, when it is UTC+1.
 */

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

export const WEEKDAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** A calendar day in Europe/London. `m0` is 0-based month. */
export interface SeedDay {
  y: number
  m0: number
  d: number
}

/** UTC ms of the last Sunday of `m0` in `y`, at 01:00 UTC (the DST switch). */
function lastSundayUtc(y: number, m0: number): number {
  const lastDay = new Date(Date.UTC(y, m0 + 1, 0))
  return Date.UTC(y, m0, lastDay.getUTCDate() - lastDay.getUTCDay(), 1, 0)
}

/** Is the given UTC instant inside British Summer Time? */
export function isLondonBst(utcMs: number): boolean {
  const y = new Date(utcMs).getUTCFullYear()
  return utcMs >= lastSundayUtc(y, 2) && utcMs < lastSundayUtc(y, 9)
}

export function londonOffsetMinutes(utcMs: number): number {
  return isLondonBst(utcMs) ? 60 : 0
}

/** UTC ms for a wall-clock time in Europe/London. */
export function londonWallToUtc(
  y: number, m0: number, d: number, hh = 0, mm = 0, ss = 0, ms = 0,
): number {
  const naive = Date.UTC(y, m0, d, hh, mm, ss, ms)
  // Two passes converge everywhere except inside the (1am) switch hour
  // itself, which no seed time falls into.
  const utc = naive - londonOffsetMinutes(naive) * 60_000
  return naive - londonOffsetMinutes(utc) * 60_000
}

/** The Europe/London calendar day (+ weekday) containing a UTC instant. */
export function londonCalendarDate(utcMs: number): SeedDay & { weekday: number } {
  const shifted = new Date(utcMs + londonOffsetMinutes(utcMs) * 60_000)
  return {
    y: shifted.getUTCFullYear(),
    m0: shifted.getUTCMonth(),
    d: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  }
}

/** Parse `'9:14 AM'` / `'12:05 PM'` into 24h clock parts. */
export function parseClock(label: string): { hh: number; mm: number } {
  const m = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(label.trim())
  if (!m) throw new Error(`Unparseable clock label: "${label}"`)
  let hh = Number(m[1]) % 12
  if (m[3] === 'PM') hh += 12
  return { hh, mm: Number(m[2]) }
}

const DAY_MS = 86_400_000

/**
 * Resolve a mock date label to a concrete Europe/London day (domain model §5):
 * - 'Today' / 'Yesterday' → relative to the anchor (the seed-run moment).
 * - 'Mon, September 2' → the most recent date before (anchor − 2 days) whose
 *   weekday + month + day all match, scanning back year by year. For the
 *   current dataset every label lands in 2024 except 'Mon, August 18' → 2025
 *   (a Sunday in 2024). This keeps every rendered label pixel-identical.
 */
export function resolveDateLabel(label: string, anchorMs: number): SeedDay {
  if (label === 'Today') {
    const { y, m0, d } = londonCalendarDate(anchorMs)
    return { y, m0, d }
  }
  if (label === 'Yesterday') {
    const { y, m0, d } = londonCalendarDate(anchorMs - DAY_MS)
    return { y, m0, d }
  }

  const m = /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat), ([A-Z][a-z]+) (\d{1,2})$/.exec(label.trim())
  if (!m) throw new Error(`Unparseable date label: "${label}"`)
  const weekday = WEEKDAY_ABBR.indexOf(m[1] as (typeof WEEKDAY_ABBR)[number])
  const m0 = (MONTH_NAMES as readonly string[]).indexOf(m[2])
  const d = Number(m[3])
  if (m0 < 0) throw new Error(`Unknown month in date label: "${label}"`)

  const anchorYear = londonCalendarDate(anchorMs).y
  const cutoff = anchorMs - 2 * DAY_MS
  for (let y = anchorYear; y >= anchorYear - 8; y--) {
    const noon = londonWallToUtc(y, m0, d, 12)
    const cal = londonCalendarDate(noon)
    // Reject day-overflow (e.g. Feb 30 rolling into March) and future dates.
    if (cal.y !== y || cal.m0 !== m0 || cal.d !== d) continue
    if (cal.weekday !== weekday) continue
    if (noon >= cutoff) continue
    return { y, m0, d }
  }
  throw new Error(`No matching past date for label: "${label}"`)
}

/** UTC ms for a clock label on a resolved seed day. */
export function dayTimeToUtc(day: SeedDay, clock: string): number {
  const { hh, mm } = parseClock(clock)
  return londonWallToUtc(day.y, day.m0, day.d, hh, mm)
}
