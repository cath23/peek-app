import { BrowserChrome } from './BrowserChrome'
import { googleSans } from './MeetCall'
import meetLogo from '../assets/meet/meet-logo.png'
import hlCamera from '../assets/meet/hl-doc-camera.svg'
import hlCheckbox from '../assets/meet/hl-doc-checkbox.svg'
import avatarBase from '../assets/meet/avatar-base.png'
import avatarOverlay from '../assets/meet/avatar-overlay.png'
import avatarAmie from '../assets/meet/avatar-amie.png'
import avatarGreg from '../assets/meet/avatar-greg.png'
import avatarJuan from '../assets/meet/avatar-juan.png'

// Light-theme Peek tokens as used by the Figma doc card (hardcoded — this
// mock is standalone and must not depend on the app's CSS).
const PILL_BG = '#ede9fe'
const PILL_TEXT = '#18181b'
const SWATCH = { insight: '#f59e0b', question: '#3b82f6', conclusion: '#0ea06f' } as const

function Avatar16({ photo }: { photo?: string }) {
  return (
    <div className="bg-[#f4f4f5] flex items-center justify-center overflow-clip relative rounded-[4px] shrink-0 size-[16px]">
      <div className="relative size-full">
        <img alt="" className="absolute max-w-none object-cover size-full" src={avatarBase} />
        <img alt="" className="absolute max-w-none object-cover size-full" src={avatarOverlay} />
        {photo && <img alt="" className="absolute max-w-none object-cover size-full" src={photo} />}
      </div>
    </div>
  )
}

function PersonChip({ name, photo }: { name: string; photo?: string }) {
  return (
    <div className="flex gap-[4px] items-center relative shrink-0">
      <Avatar16 photo={photo} />
      <span className="text-[#0d0d0d] text-[9px] leading-[12px] whitespace-nowrap" style={googleSans}>
        {name}
      </span>
    </div>
  )
}

function Pill({ type, label }: { type: keyof typeof SWATCH; label: string }) {
  return (
    <div className="flex gap-[6px] items-center justify-center px-[6px] py-[2px] rounded-[4px] shrink-0" style={{ backgroundColor: PILL_BG }}>
      <div className="rounded-[2px] shrink-0 size-[10px]" style={{ backgroundColor: SWATCH[type] }} />
      <p className="font-medium leading-[1.1] text-[11px] whitespace-nowrap" style={{ color: PILL_TEXT, fontFamily: "'Geist', sans-serif" }}>
        {label}
      </p>
    </div>
  )
}

function KeyPointGroup({ type, label, lines, width }: { type: keyof typeof SWATCH; label: string; lines: string[]; width?: number }) {
  return (
    <div className="flex flex-col gap-[12px] items-start relative shrink-0" style={{ width: width ?? '100%' }}>
      <Pill type={type} label={label} />
      <div className="flex flex-col gap-[8px] items-start text-[#0d0d0d] text-[14px] w-full" style={googleSans}>
        {lines.map((line, i) => (
          <ul key={i} className="w-full">
            <li className="list-disc ms-[21px]">
              <span className="leading-[1.15]">{line}</span>
            </li>
          </ul>
        ))}
      </div>
    </div>
  )
}

function ActionItem({ text, name, photo }: { text: string; name: string; photo?: string }) {
  return (
    <div className="flex gap-px items-center relative shrink-0 w-full">
      <div className="flex h-[36px] items-start shrink-0 w-[21px]">
        <div className="overflow-clip relative shrink-0 size-[16px]">
          <div className="absolute inset-[16.67%]">
            <img alt="" className="block max-w-none size-full" src={hlCheckbox} />
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-[4px] items-start justify-center min-w-px relative">
        <p className="leading-[1.15] text-[#0d0d0d] text-[14px] w-full" style={googleSans}>{text}</p>
        <PersonChip name={name} photo={photo} />
      </div>
    </div>
  )
}

/** Scenario 1, scene 2 — "You left the meeting" + the Highlights doc
 *  (Figma 681:2417). `showHighlights` is beat 2: the doc card rises in. */
export function MeetEnded({ showHighlights }: { showHighlights: boolean }) {
  return (
    <div className="bg-white relative size-full">
      <BrowserChrome tabTitle="Meet - Kick off" urlHost="meet.google.com" urlPath="/uir-wmte-coi?authuser=2" />

      <div className="absolute bg-white h-[945px] left-0 overflow-clip top-[79px] w-[1440px]">
        {/* Meet logo + status line */}
        <div className="absolute h-[56px] left-[16px] top-[28px] w-[59px]">
          <img alt="" className="absolute inset-0 max-w-none object-cover size-full" src={meetLogo} />
        </div>
        <div className="-translate-y-1/2 absolute left-[80px] text-[#202124] text-[12px] top-[53.5px] whitespace-nowrap" style={googleSans}>
          <p className="leading-[normal]">Returning to home screen</p>
        </div>

        {/* Center block */}
        <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 text-[#0d0d0d] text-[36px] text-center top-[139.5px] whitespace-nowrap" style={googleSans}>
          <p className="leading-[normal]">You left the meeting</p>
        </div>
        <div className="absolute border border-[#747775] border-solid flex items-center justify-center left-[571px] px-[24px] py-[12px] rounded-[999px] top-[194px]">
          <span className="font-medium text-[#0b57d0] text-[14px] leading-[normal] whitespace-nowrap" style={googleSans}>Rejoin</span>
        </div>
        <div className="absolute bg-[#0b57d0] flex items-center justify-center left-[668px] px-[24px] py-[12px] rounded-[999px] top-[194px]">
          <span className="font-medium text-[14px] text-white leading-[normal] whitespace-nowrap" style={googleSans}>Return to home screen</span>
        </div>
        <div className="-translate-x-1/2 absolute flex items-center justify-center left-1/2 px-[24px] py-[12px] rounded-[999px] top-[252px]">
          <span className="font-medium text-[#0b57d0] text-[14px] leading-[normal] whitespace-nowrap" style={googleSans}>Submit feedback</span>
        </div>

        {/* Highlights doc — beat 2 rises in */}
        <div
          className="absolute bg-white border border-[#e4e4e7] border-solid h-[701px] left-[390px] overflow-clip rounded-[24px] top-[352px] w-[659px] transition-all duration-500 ease-out"
          style={{
            opacity: showHighlights ? 1 : 0,
            transform: showHighlights ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          {/* Header */}
          <div className="absolute left-[23px] overflow-clip rounded-full size-[40px] top-[23px]" style={{ backgroundColor: PILL_BG }}>
            <div className="absolute left-[12px] overflow-clip size-[16px] top-[12px]">
              <div className="absolute inset-[15.3%_12.5%_20.83%_12.5%]">
                <img alt="" className="block max-w-none size-full" src={hlCamera} />
              </div>
            </div>
          </div>
          <div className="-translate-y-1/2 absolute font-medium left-[80px] text-[#0d0d0d] text-[20px] top-[33.5px] whitespace-nowrap" style={googleSans}>
            <p className="leading-[normal]">Highlights</p>
          </div>
          <div className="-translate-y-1/2 absolute left-[79px] text-[#5f6368] text-[12px] top-[57.5px] whitespace-nowrap" style={googleSans}>
            <p className="leading-[normal]">Kick off · September 9, 2026 · 42 min</p>
          </div>
          <div className="absolute flex gap-[12px] items-center left-[79px] top-[77px]">
            <PersonChip name="Amie Miles" photo={avatarAmie} />
            <PersonChip name="Alice Curtis" />
            <PersonChip name="Greg Bothman" photo={avatarGreg} />
            <PersonChip name="Juan Foley" photo={avatarJuan} />
          </div>
          <div className="absolute h-px bg-[#f4f4f5] left-[23px] top-[109px] w-[611px]" />

          {/* Key points */}
          <div className="absolute flex flex-col gap-[16px] items-start left-[23px] top-[126px] w-[611px]">
            <p className="font-semibold text-[#5f6368] text-[12px] uppercase leading-[normal] w-full" style={googleSans}>
              Key points
            </p>
            <div className="flex flex-col gap-[16px] items-start relative shrink-0 w-full">
              <KeyPointGroup
                type="insight"
                label="Insight"
                lines={[
                  'Went with Stripe Checkout for v1 instead of a custom card form.',
                  'Walked through the failure and 3DS-declined states and where customers get stuck.',
                ]}
              />
              <KeyPointGroup
                type="question"
                label="Question"
                width={592}
                lines={['What does Stripe return after a 3DS decline, and which codes do we show the customer?']}
              />
              <KeyPointGroup
                type="conclusion"
                label="Conclusion"
                width={437}
                lines={['Agreed reconciliation needs a fallback in case a webhook is late.']}
              />
            </div>
          </div>

          {/* Action items */}
          <p className="-translate-y-1/2 absolute font-semibold left-[23px] text-[#5f6368] text-[12px] top-[392.5px] uppercase leading-[normal] whitespace-nowrap" style={googleSans}>
            Action items
          </p>
          <div className="absolute flex flex-col gap-[8px] items-start left-[23px] top-[416px] w-[611px]">
            <ActionItem text="Draft the payment flow in Figma, including failure states" name="Alice Curtis" />
            <ActionItem text="Scope webhooks and the reconciliation job as the first PR" name="Greg Bothman" photo={avatarGreg} />
            <ActionItem text="Send Stripe test keys and the decline codes to handle" name="Juan Foley" photo={avatarJuan} />
          </div>
        </div>
      </div>
    </div>
  )
}
