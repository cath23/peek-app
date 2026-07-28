import peekBadge from '../assets/meet/peek-favicon.svg'
import { STAGE_H, STAGE_W } from '../lib/stage'

/**
 * The film's bookend: mark, name, one line. It plays twice — over the waiting
 * topic at the open, where the line doubles as the title and says what you're
 * about to watch, and over the finished topic at the end, where the same words
 * read as a result rather than a promise.
 *
 * The scrim sits behind the text only. Dimming a whole frame to make type
 * legible means the un-dim becomes one of the biggest events in the film, which
 * is absurd for a title leaving.
 */
export function BrandCard() {
  return (
    <div
      data-layer="brand"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: STAGE_W,
        height: STAGE_H,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0,
        fontFamily: "'Geist', sans-serif",
      }}
    >
      <div
        data-brand-scrim
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          height: 300,
          transform: 'translateY(-50%)',
          background:
            'radial-gradient(620px 190px at 50% 50%, rgba(4,5,7,0.92), rgba(4,5,7,0.72) 45%, rgba(4,5,7,0) 78%)',
        }}
      />
      <div
        data-brand-block
        style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}
      >
        <div data-brand-mark style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src={peekBadge} alt="" width={56} height={56} style={{ borderRadius: 18 }} />
          <span style={{ fontSize: 54, fontWeight: 600, color: '#f4f6fa', letterSpacing: '-0.025em' }}>
            Peek
          </span>
        </div>
        <p
          data-brand-line
          style={{ fontSize: 23, color: 'rgba(255,255,255,0.62)', letterSpacing: '-0.01em' }}
        >
          Highlights land in the topic.
        </p>
      </div>
    </div>
  )
}
