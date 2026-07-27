// Scenario title — the product-reveal card the film opens on.
//
// Two lines that animate separately: the number ticks in first and holds the
// eye while the title itself rises out of a mask, word by word. The wrapper
// carries the blur-off, so the whole block sharpens as it settles.
//
// Geometry is inline rather than utility classes: this layer has to be exactly
// the stage, and the title is the first thing anyone sees.
export function TitleCard({ width, height }: { width: number; height: number }) {
  return (
    <div
      data-layer="title"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Geist', sans-serif",
      }}
    >
      <div
        data-title-block
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}
      >
        <p
          data-title-num
          style={{
            fontFamily: "'Geist Mono', ui-monospace, monospace",
            fontSize: 13,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.42em',
            color: 'rgba(255,255,255,0.42)',
          }}
        >
          Scenario 01
        </p>
        <h1
          data-title-line
          style={{
            fontSize: 76,
            fontWeight: 600,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            color: '#f4f6fa',
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
          }}
        >
          Highlights in Huddle
        </h1>
      </div>
    </div>
  )
}
