import type { ReactNode } from 'react'
import { STAGE_H, STAGE_W, WINDOW_SCALE } from '../lib/stage'

/**
 * A browser window sitting on the void: inset, rounded, with a soft shadow.
 * Static — the timeline animates the LAYER around this, so a beat can move or
 * scale the window without having to compose its inset into every tween.
 */
export function Window({ children }: { children: ReactNode }) {
  return (
    <div
      data-window
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: STAGE_W,
        height: STAGE_H,
        transform: `scale(${WINDOW_SCALE})`,
        transformOrigin: '50% 50%',
        // Radius is in local pixels, so it reads as 14 once inset.
        borderRadius: 16,
        overflow: 'clip',
        boxShadow: '0 44px 96px rgba(0,0,0,0.58), 0 10px 28px rgba(0,0,0,0.42)',
      }}
    >
      {children}
    </div>
  )
}
