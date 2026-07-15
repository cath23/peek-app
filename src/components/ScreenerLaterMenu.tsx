import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './ui/Button'

/** "Later" reminder options (user request 2026-07-15). Each returns an
 *  absolute timestamp after which the Screener item reappears. */
const OPTIONS: { label: string; ms: number }[] = [
  { label: 'In 1 hour', ms: 60 * 60 * 1000 },
  { label: 'In 3 hours', ms: 3 * 60 * 60 * 1000 },
  { label: 'Tomorrow', ms: 24 * 60 * 60 * 1000 },
  { label: 'In a week', ms: 7 * 24 * 60 * 60 * 1000 },
]

/**
 * The "Later" button + its reminder-duration menu. Portalled so it escapes the
 * Desk panel's overflow clip; closes on outside click, Escape, and after pick.
 */
export function ScreenerLaterMenu({ onPick }: { onPick: (untilMs: number) => void }) {
  const btnRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!rect) return
    const close = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return
      if (btnRef.current?.contains(e.target as Node)) return
      setRect(null)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setRect(null)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [rect])

  return (
    <div ref={btnRef}>
      <Button
        variant="outlined"
        size="small"
        onClick={() => setRect(rect ? null : (btnRef.current?.getBoundingClientRect() ?? null))}
      >
        Later
      </Button>
      {rect &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-50 bg-bg-elevated border border-border-default rounded-lg shadow-lg p-1 min-w-[160px]"
            style={{ top: rect.bottom + 4, left: rect.left }}
          >
            <div className="flex items-center h-7 px-3">
              <span className="text-[12px] font-medium leading-none text-text-secondary">Remind me</span>
            </div>
            {OPTIONS.map((o) => (
              <div
                key={o.label}
                className="flex items-center h-9 px-3 rounded-lg cursor-pointer transition-colors hover:bg-bg-hover"
                onClick={() => {
                  setRect(null)
                  onPick(Date.now() + o.ms)
                }}
              >
                <span className="text-[14px] font-normal leading-[1.4] text-text-primary">{o.label}</span>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
