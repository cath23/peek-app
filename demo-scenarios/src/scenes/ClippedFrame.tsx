import { peekSrc, type FrameLink } from '../lib/frames'
import { VIEW_H, VIEW_W } from '../lib/stage'

/**
 * The highlights card, alone on screen — and it is the real card, not a
 * replica: a copy of the app with everything but the card clipped away. That's
 * what makes the landing exact. When it docks it sits pixel for pixel on top of
 * the app's own card, so the crossfade between them can't be seen, and it can
 * never drift out of date with the component.
 *
 * Elements, each doing one job:
 *   outer  — placement (translate + scale).
 *   shadow — a plain rounded box-shadow, sized to the visible card. It can't
 *            be a drop-shadow filter on `outer`: clip-path is applied after
 *            filter, so the shadow would be clipped away with the rest — and a
 *            60px blur over a full-frame layer costs more to rasterise than
 *            everything else in the film put together.
 *   clip   — the window onto the card, plus the landing squash. Both scale
 *            together, so the card deforms as one object.
 *   frame  — the app.
 */
export function ClippedFrame({ frame }: { frame: FrameLink }) {
  return (
    <div
      data-clipped-outer={frame.id}
      className="absolute left-0 top-0"
      style={{
        width: VIEW_W,
        height: VIEW_H,
        transformOrigin: '0 0',
        opacity: 0,
        willChange: 'transform',
      }}
    >
      <div
        data-clipped-shadow={frame.id}
        className="absolute"
        style={{ borderRadius: 8, opacity: 0, pointerEvents: 'none' }}
      />
      <div data-clipped-clip={frame.id} style={{ width: VIEW_W, height: VIEW_H }}>
        <iframe
          ref={frame.ref}
          title={frame.id === 'bar' ? 'Highlights (collapsed)' : 'Highlights'}
          src={peekSrc(frame.id)}
          width={VIEW_W}
          height={VIEW_H}
          style={{ border: 0, display: 'block', pointerEvents: 'none' }}
        />
      </div>
    </div>
  )
}
