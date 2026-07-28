import pinMark from '../../assets/figma/pin-figma-mark.png'
import { FEEDBACK, FeedbackWidget } from './LinearWidget'

const inter = { fontFamily: "'Inter', sans-serif" }

// Figma comment pins (mock 823:14917): the teardrop with the square corner at
// bottom-left, carrying the AI's avatar. The timeline pops them onto the
// canvas one after another, transform-origin at the square corner so each pin
// grows out of the point it is anchored to.

function PinBadge({ size = 28 }: { size?: number }) {
  const inner = size - 8
  return (
    <div
      className="bg-[#2c2c2c] flex items-center p-[4px]"
      style={{
        width: size,
        height: size,
        border: '1px solid #414141',
        borderRadius: `${size / 2}px ${size / 2}px ${size / 2}px 0`,
        filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.3)) drop-shadow(0px 4px 3px rgba(0,0,0,0.4))',
      }}
    >
      <div className="bg-white overflow-clip relative rounded-full shrink-0" style={{ width: inner, height: inner }}>
        <img alt="" className="absolute block" src={pinMark} style={{ left: '30%', top: '20%', width: '40%', height: '60%' }} />
      </div>
    </div>
  )
}

/** A pin on the canvas, positioned by its anchor (the square corner). */
export function CommentPin({ x, y, id }: { x: number; y: number; id: string }) {
  return (
    <div
      data-pin={id}
      className="absolute"
      style={{ left: x, top: y - 28, width: 28, height: 28, transformOrigin: '0 100%' }}
    >
      <PinBadge />
    </div>
  )
}

export const THREAD_W = 300

// The opened comment (doc beat 6): the single customer-feedback widget on
// top, and under it what should change in the design because of it. Anchored
// by its top-right corner to the hero pin, so the bloom grows out of the pin.
export function CommentThread({ x, y }: { x: number; y: number }) {
  return (
    <div
      data-thread
      className="absolute bg-[#2c2c2c] flex flex-col gap-[9px] rounded-[14px] shadow-[0px_4px_6px_-4px_rgba(0,0,0,0.4),0px_10px_15px_-3px_rgba(0,0,0,0.5)]"
      style={{
        ...inter,
        left: x - THREAD_W,
        top: y,
        width: THREAD_W,
        padding: '11px 12px 12px',
        border: '1px solid #494949',
        transformOrigin: '100% 0',
      }}
    >
      <div className="flex gap-[7px] items-center">
        <div className="bg-white overflow-clip relative rounded-full shrink-0" style={{ width: 20, height: 20, border: '1px solid #414141' }}>
          <img alt="" className="absolute block" src={pinMark} style={{ left: '30%', top: '20%', width: '40%', height: '60%' }} />
        </div>
        <p className="font-semibold leading-[normal] text-[12.5px] text-white">Figma AI</p>
        <p className="font-normal leading-[normal] text-[#8a8f98] text-[11px]">Just now</p>
      </div>
      <FeedbackWidget item={FEEDBACK[1]} width={THREAD_W - 24} />
      <p className="font-normal leading-[1.45] text-[#d4d4d8] text-[12.5px]">
        Customers dead-end when 3DS fails. Show Stripe's decline reason here, with a route back to payment methods.
      </p>
      <div
        className="flex items-center px-[10px]"
        style={{ height: 30, border: '1px solid #494949', borderRadius: 15 }}
      >
        <p className="font-normal leading-[normal] text-[#808080] text-[12px]">Reply</p>
      </div>
    </div>
  )
}
