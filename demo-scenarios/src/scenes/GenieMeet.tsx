import { MeetCall } from './MeetCall'
import { Window } from './Window'
import { STAGE_H } from '../lib/stage'

// ── The macOS genie, done with ribbons ──
//
// A true genie warps the window's pixels, which plain CSS transforms can't do
// to a single element. But sixteen elements can each be transformed
// independently: the Meet window is rendered sixteen times, each copy clipped
// to one horizontal ribbon. At rest the ribbons tile the original exactly —
// same pixels, invisible seams. During the pour, each ribbon narrows toward
// the dock point and translates down, with the bottom ribbon leading and each
// one above trailing its neighbour — so the window necks into a funnel at the
// bottom while the top is still wide, which is the genie silhouette.
//
// The whole layer is hidden except during the pour (visibility, so sixteen
// copies of the scene never cost a paint), and wears a vertical motion blur
// driven by pour speed — which also smooths any sub-pixel ribbon seams.
//
// Per-ribbon transforms are computed in the film's render() from one driver
// value (see scenario1.tsx), keeping the one-writer rule.

export const GENIE_STRIPS = 28
export const GENIE_STRIP_H = STAGE_H / GENIE_STRIPS

export function GenieMeet() {
  return (
    <div
      data-layer="genie"
      className="absolute inset-0"
      style={{ visibility: 'hidden', filter: 'url(#blur-genie)' }}
    >
      {Array.from({ length: GENIE_STRIPS }, (_, i) => {
        const top = GENIE_STRIP_H * i
        const bottom = STAGE_H - top - GENIE_STRIP_H
        return (
          <div
            key={i}
            data-genie-strip
            className="absolute inset-0"
            style={{ clipPath: `inset(${top}px 0px ${bottom}px 0px)` }}
          >
            <Window shadow={false}>
              <MeetCall />
            </Window>
          </div>
        )
      })}
    </div>
  )
}
