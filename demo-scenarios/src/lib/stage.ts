// Stage geometry, shared by the layers and the timeline.
//
// The film plays on a fixed 1440×1024 stage. The app windows do NOT fill it:
// they sit inset on the void with rounded corners and a shadow, which is what
// the genre does — full-bleed screenshots read as cramped, and the void gives
// the whip and the card-alone beats somewhere to happen.

export const STAGE_W = 1440
export const STAGE_H = 1024

/** The app viewport inside a browser window, and the chrome above it. */
export const VIEW_W = 1440
export const VIEW_H = 945
export const CHROME_H = 79

/** How much of the frame a window occupies (recipes: 60–80% of frame, with
 *  margin; at 0.88 the 1440-wide window reads as 1267 on a 1440 stage). */
export const WINDOW_SCALE = 0.88

/** A point in window-local coordinates → where it lands on the stage. */
export function toStage(px: number, py: number): { x: number; y: number } {
  return {
    x: STAGE_W / 2 + (px - STAGE_W / 2) * WINDOW_SCALE,
    y: STAGE_H / 2 + (py - STAGE_H / 2) * WINDOW_SCALE,
  }
}
