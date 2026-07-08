import { useState, useRef, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Tooltip } from './Tooltip'
import { type ReactNode } from 'react'

interface WithTooltipProps {
  label: string
  placement?: 'top' | 'bottom'
  children: ReactNode
}

const GAP = 6
const VIEWPORT_PAD = 8

export function WithTooltip({ label, placement = 'top', children }: WithTooltipProps) {
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<React.CSSProperties>({ position: 'fixed', zIndex: 9999, pointerEvents: 'none', visibility: 'hidden' })

  const reposition = useCallback(() => {
    const trigger = ref.current
    const tip = tooltipRef.current
    if (!trigger || !tip) return

    const triggerRect = trigger.getBoundingClientRect()
    const tipRect = tip.getBoundingClientRect()

    // Vertical position
    const top = placement === 'bottom'
      ? triggerRect.bottom + GAP
      : triggerRect.top - tipRect.height - GAP

    // Horizontal: center, then clamp to viewport
    let left = triggerRect.left + triggerRect.width / 2 - tipRect.width / 2
    left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - tipRect.width - VIEWPORT_PAD))

    setStyle({
      position: 'fixed',
      top,
      left,
      zIndex: 9999,
      pointerEvents: 'none',
      visibility: 'visible',
    })
  }, [placement])

  // Reposition after portal renders so we can measure the tooltip
  useLayoutEffect(() => {
    if (show) reposition()
  }, [show, reposition])

  return (
    <div
      ref={ref}
      className="inline-flex shrink-0"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show &&
        createPortal(
          <div ref={tooltipRef} style={style}>
            <Tooltip label={label} />
          </div>,
          document.body
        )}
    </div>
  )
}
