// The pointer that ends the call.
//
// Positioned by its tip: the timeline translates the wrapper, and TIP_X/TIP_Y
// say where the tip sits inside the SVG, so a beat can aim at a button's
// centre without arithmetic at the call site.
export const TIP_X = 4
export const TIP_Y = 2.5

export function CursorArrow() {
  return (
    <div data-layer="cursor" className="absolute left-0 top-0" style={{ opacity: 0 }}>
      <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
        <path
          d="M4 2.5 L4 24.6 L10.3 18.5 L14.2 27.6 L18.7 25.7 L14.9 17.0 L22.6 16.3 Z"
          fill="#0b0b0c"
          stroke="#ffffff"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
