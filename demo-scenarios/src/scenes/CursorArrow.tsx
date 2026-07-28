// The pointer that ends the call, and the flash its click leaves behind.
//
// Sized well above a real cursor: at true scale it is 0.06% of the frame and
// measures as nothing — it can't carry a beat it's supposed to motivate.
//
// Positioned by its tip: the timeline translates the wrapper, and TIP_X/TIP_Y
// say where the tip sits inside the SVG, so a beat can aim at a button's centre
// without arithmetic at the call site.
export const TIP_X = 6
export const TIP_Y = 4

export function CursorArrow() {
  return (
    <>
      {/* The click, made unmissable: a ring that expands off the button. */}
      <div
        data-layer="click-flash"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 96,
          height: 96,
          marginLeft: -48,
          marginTop: -48,
          borderRadius: 999,
          border: '3px solid rgba(255,255,255,0.85)',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
      <div data-layer="cursor" className="absolute left-0 top-0" style={{ opacity: 0 }}>
        <svg width="42" height="48" viewBox="0 0 28 32" fill="none">
          <path
            d="M4 2.5 L4 24.6 L10.3 18.5 L14.2 27.6 L18.7 25.7 L14.9 17.0 L22.6 16.3 Z"
            fill="#0b0b0c"
            stroke="#ffffff"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </>
  )
}
