import { BrowserChrome } from '../BrowserChrome'
import { CHROME_H, VIEW_H, VIEW_W } from '../../lib/stage'
import figmaFavicon from '../../assets/figma/figma-favicon.svg'
import leftRail from '../../assets/figma/figma-left-rail.png'
import pagesIcons from '../../assets/figma/figma-pages-icons.png'
import bottomToolbar from '../../assets/figma/figma-bottom-toolbar.png'
import rightPanel from '../../assets/figma/figma-right-panel.png'
import avatarA from '../../assets/figma/avatar-collab-a.jpg'
import avatarB from '../../assets/figma/avatar-collab-b.jpg'
import {
  PhoneBilling,
  PhoneHandoff,
  PhoneConfirming,
  PhoneSuccess,
  PhoneFailed,
  Phone3dsTodo,
} from './phones'
import { LinearWidget } from './LinearWidget'
import { AiPanel } from './AiPanel'
import { CommentPin, CommentThread } from './CommentPin'

const inter = { fontFamily: "'Inter', sans-serif" }

// The Figma-in-a-browser scene, hand-built pixel-perfect from the mock
// (Figma 761:1286): dark Figma chrome around a light canvas holding the six
// payment-flow drafts, the Linear project widget, the designer's sticky note,
// and the AI panel. The comment pins and the opened thread are here from
// frame 0 — the timeline pops them in.

/** Pin anchors in canvas coordinates (the square corner of the teardrop).
 *  Two from the mock; the hero pin moved next to the sticky note (ruling). */
export const PINS = [
  { id: 'p1', x: 450, y: 589 },
  { id: 'p2', x: 621, y: 536 },
  { id: 'hero', x: 1004, y: 470 },
]
/** The opened comment hangs off the hero pin, opening down-left. */
export const THREAD_X = PINS[2].x - 8
export const THREAD_Y = PINS[2].y + 10

const PHONES: { label: string; x: number; Comp: () => JSX.Element }[] = [
  { label: 'Billing', x: -152, Comp: PhoneBilling },
  { label: 'Handoff', x: 80.5, Comp: PhoneHandoff },
  { label: 'Confirming', x: 313, Comp: PhoneConfirming },
  { label: 'Success', x: 545.5, Comp: PhoneSuccess },
  { label: 'Failed', x: 778, Comp: PhoneFailed },
  { label: '3ds-declined-TODO', x: 1010.5, Comp: Phone3dsTodo },
]
const PHONE_Y = 395.6

export function FigmaWindow() {
  return (
    <div className="absolute inset-0" style={{ background: '#202124' }}>
      <BrowserChrome
        tabTitle="Payment integration - Figma"
        urlHost="figma.com"
        urlPath="/design/A473dq4yDZ8QhK9sS1uPH3/Payment-integration"
        favicon={figmaFavicon}
      />

      {/* The Figma app fills the viewport below the browser chrome. */}
      <div className="absolute overflow-clip" style={{ left: 0, top: CHROME_H, width: VIEW_W, height: VIEW_H }}>
        {/* Canvas — everything on it sits under the chrome panels. */}
        <div data-canvas className="absolute inset-0" style={{ background: '#ccccd1' }}>
          {PHONES.map(({ label, x, Comp }) => (
            <div key={label} className="absolute" style={{ left: x, top: PHONE_Y }}>
              <p
                className="absolute font-normal leading-[normal] text-[11px] whitespace-nowrap"
                style={{ ...inter, color: '#6e6e73', top: -16, left: 0 }}
              >
                {label}
              </p>
              <Comp />
            </div>
          ))}

          <div className="absolute" style={{ left: 354, top: 59 }}>
            <LinearWidget />
          </div>

          <div
            data-sticky
            className="absolute bg-[#fef08a] shadow-[1px_2px_4px_0px_rgba(0,0,0,0.18)]"
            style={{ left: 899.3, top: 360, width: 102.25, height: 68.7, transform: 'rotate(-4deg)' }}
          >
            <p
              className="absolute leading-[1.35] text-[#5e340f] text-[10.3px]"
              style={{ fontFamily: "'Caveat', cursive", left: 8.3, top: 4, width: 86 }}
            >
              which decline reasons?
              <br />
              show the card?
              <br />
              3DS declined state??
            </p>
          </div>

          {PINS.map((pin) => (
            <CommentPin key={pin.id} id={pin.id} x={pin.x} y={pin.y} />
          ))}
          <CommentThread x={THREAD_X} y={THREAD_Y} />
        </div>

        {/* Left rail (toolbar icon strip). */}
        <div className="absolute bg-[#2c2c2c]" style={{ left: 0, top: 0, width: 48, height: VIEW_H, borderRight: '1px solid #444' }}>
          <img alt="" className="absolute block" src={leftRail} style={{ left: 5, top: 2, width: 39, height: 237 }} />
        </div>

        {/* Left sidebar: pages + layers. */}
        <div className="absolute bg-[#2c2c2c] overflow-clip" style={{ ...inter, left: 48, top: 0, width: 248, height: VIEW_H, borderRight: '1px solid #444' }}>
          <p className="absolute font-medium leading-[normal] text-[11px] text-white tracking-[0.2px]" style={{ left: 17, top: 82 }}>Pages</p>
          <img alt="" className="absolute block" src={pagesIcons} style={{ left: 183, top: 73, width: 54, height: 30 }} />
          <div className="absolute bg-[#383838] rounded-[6px]" style={{ left: 8, top: 109, width: 231, height: 25 }} />
          <p className="absolute font-medium leading-[normal] text-[#f4f4f4] text-[11px] tracking-[0.2px]" style={{ left: 17, top: 116 }}>Main flow</p>
          <p className="absolute font-medium leading-[normal] text-[#f4f4f4] text-[11px] tracking-[0.2px]" style={{ left: 17, top: 147 }}>Loading &amp; empty states</p>
          <div className="absolute bg-[#3a3a3a]" style={{ left: 0, top: 218, width: 248, height: 1 }} />
          <p className="absolute font-medium leading-[normal] text-[11px] text-white tracking-[0.2px]" style={{ left: 17, top: 231 }}>Layers</p>
        </div>

        {/* File title, floating over the sidebar top. */}
        <div className="absolute bg-[#2c2c2c]" style={{ ...inter, left: 63, top: 15, width: 172, height: 44 }}>
          <p className="absolute font-medium leading-[normal] text-[13px] text-white tracking-[0.2px] whitespace-nowrap" style={{ left: 3, top: 17.5 - 9 }}>
            Payment integration
          </p>
          <svg className="absolute" style={{ left: 138, top: 13 }} width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M2.5 4L5.5 7L8.5 4" stroke="#9b9b9b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="absolute font-medium leading-[normal] text-[#bfbfbf] text-[11px] tracking-[0.2px] whitespace-nowrap" style={{ left: 3, top: 41 - 8.5 }}>
            Peek payment flows
          </p>
        </div>

        {/* Bottom toolbar. */}
        <img alt="" className="absolute block" src={bottomToolbar} style={{ left: 518, top: 885, width: 473, height: 50 }} />

        {/* Right panel. */}
        <div className="absolute bg-[#2c2c2c] overflow-clip" style={{ left: 1221, top: 0, width: 219, height: VIEW_H, borderLeft: '1px solid #444' }}>
          <img alt="" className="absolute block" src={rightPanel} style={{ right: 1, top: 2, width: 217, height: 931 }} />
          <img alt="" className="absolute block rounded-full object-cover" src={avatarB} style={{ left: 29, top: 12, width: 22, height: 22, border: '1px solid #2c2c2c' }} />
          <img alt="" className="absolute block rounded-full object-cover" src={avatarA} style={{ left: 8, top: 12, width: 22, height: 22, border: '2px solid #2c2c2c' }} />
        </div>

        <AiPanel />
      </div>
    </div>
  )
}
