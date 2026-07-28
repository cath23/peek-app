import peekBadge from '../assets/meet/peek-favicon.svg'
import { STAGE_H, STAGE_W } from '../lib/stage'

/**
 * The film's bookend: mark, name, one line — deliberately small (ruling
 * 2026-07-28). It plays twice, identically: over the blurred call at the open,
 * where the line doubles as the title and says what you're about to watch, and
 * over the blurred topic at the end, where the same words read as a result.
 *
 * No scrim of its own: the background behind it is blurred and dimmed by the
 * timeline, and that treatment is what carries the text.
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
        gap: 16,
        opacity: 0,
        fontFamily: "'Geist', sans-serif",
      }}
    >
      <div data-brand-mark style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <img src={peekBadge} alt="" width={38} height={38} style={{ borderRadius: 12 }} />
        <span style={{ fontSize: 36, fontWeight: 600, color: '#f4f6fa', letterSpacing: '-0.02em' }}>
          Peek
        </span>
      </div>
      <p
        data-brand-line
        style={{ fontSize: 17, color: 'rgba(255,255,255,0.72)', letterSpacing: '-0.005em' }}
      >
        Highlights land in the topic.
      </p>
    </div>
  )
}
