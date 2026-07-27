import peekBadge from '../assets/meet/peek-favicon.svg'
import { STAGE_H, STAGE_W } from '../lib/stage'

/**
 * The end card. After all that motion, the rest is what makes it feel
 * finished: mark, name, one line, and 1.5s of stillness (recipes §5).
 */
export function EndCard() {
  return (
    <div
      data-layer="endcard"
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
        gap: 26,
        opacity: 0,
        fontFamily: "'Geist', sans-serif",
      }}
    >
      <div data-endcard-mark style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <img src={peekBadge} alt="" width={56} height={56} style={{ borderRadius: 18 }} />
        <span style={{ fontSize: 52, fontWeight: 600, color: '#f4f6fa', letterSpacing: '-0.02em' }}>
          Peek
        </span>
      </div>
      <p
        data-endcard-line
        style={{ fontSize: 21, color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em' }}
      >
        Highlights land in the topic.
      </p>
    </div>
  )
}
