import { BrowserChrome } from './BrowserChrome'
import micBadgeDesigner from '../assets/meet/mic-badge-designer.svg'
import micBadgeAlice from '../assets/meet/mic-badge-alice.svg'
import micOff from '../assets/meet/mic-off.svg'
import moreAudio from '../assets/meet/more-audio.svg'
import videocam from '../assets/meet/videocam.svg'
import moreVideo from '../assets/meet/more-video.svg'
import shareScreen from '../assets/meet/share-screen.svg'
import mood from '../assets/meet/mood.svg'
import closedCaption from '../assets/meet/closed-caption.svg'
import backHand from '../assets/meet/back-hand.svg'
import moreVert from '../assets/meet/more-vert.svg'
import callEnd from '../assets/meet/call-end.svg'
import chat from '../assets/meet/chat.svg'
import lockPerson from '../assets/meet/lock-person.svg'
import info from '../assets/meet/info.svg'

export const googleSans = {
  fontFamily: "'Google Sans Flex', 'Google Sans', 'Roboto', sans-serif",
}

// ── Camera-off avatar tiles ──
//
// Every participant renders as a letter tile (ruling 2026-07-28), all built
// from Alice's Figma tile (681:2339): a coloured initial circle over a dim
// radial vignette of the same hue. The vignette decay factors are lifted from
// Alice's original gradient stops, so her tile stays the pixel reference and
// the others inherit the exact treatment in their own colour.

const VIGNETTE_DECAY: [number, number][] = [
  [0, 1],
  [0.35, 0.8],
  [0.65, 0.64],
  [0.825, 0.45],
  [1, 0.27],
]

function vignette([r, g, b]: [number, number, number]) {
  const stops = VIGNETTE_DECAY.map(
    ([off, f]) =>
      `<stop stop-color='rgba(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)},1)' offset='${off}'/>`,
  ).join('')
  return {
    backgroundImage: `url("data:image/svg+xml;utf8,<svg viewBox='0 0 684 389' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(48.857 0 0 27.786 342 194.5)'>${stops}</radialGradient></defs></svg>")`,
  }
}

function AvatarTile({
  name,
  letter,
  circle,
  tint,
  badge,
  badgeOpacity = 0.17,
}: {
  name: string
  letter: string
  /** The initial circle's colour (Meet's avatar palette). */
  circle: string
  /** Vignette centre — a dimmed cousin of the circle colour. */
  tint: [number, number, number]
  badge?: string
  badgeOpacity?: number
}) {
  return (
    <div className="overflow-clip relative rounded-[24px]" style={vignette(tint)}>
      <NameLabel name={name} />
      <div
        className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 rounded-full size-[88px] top-[calc(50%+0.5px)]"
        style={{ backgroundColor: circle }}
      />
      <div
        className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-normal justify-center leading-[0] left-1/2 size-[88px] text-[48px] text-center text-white top-[calc(50%+0.5px)]"
        style={googleSans}
      >
        <p className="leading-[normal]">{letter}</p>
      </div>
      {badge && <MutedBadge src={badge} bgOpacity={badgeOpacity} />}
    </div>
  )
}

function NameLabel({ name }: { name: string }) {
  return (
    <div
      className="-translate-y-1/2 absolute flex flex-col font-medium justify-center leading-[0] left-[16px] text-[16px] text-white top-[363px] whitespace-nowrap"
      style={googleSans}
    >
      <p className="leading-[normal]">{name}</p>
    </div>
  )
}

function MutedBadge({ src, bgOpacity }: { src: string; bgOpacity: number }) {
  return (
    <div
      className="absolute overflow-clip right-[16px] rounded-[100px] size-[26px] top-[16px]"
      style={{ backgroundColor: `rgba(255,255,255,${bgOpacity})` }}
    >
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[15.45px] left-[calc(50%-0.53px)] top-[calc(50%+0.23px)] w-[14.85px]">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={src} />
      </div>
    </div>
  )
}

function RoundControl({
  icon,
  width = 56,
  bg = '#333537',
  handle,
}: {
  icon: string
  width?: number
  bg?: string
  /** Marks a control the film animates (the timeline presses it). */
  handle?: string
}) {
  return (
    <div
      {...(handle ? { [`data-${handle}`]: '' } : {})}
      className="h-[48px] overflow-clip relative rounded-[100px] shrink-0"
      style={{ width, backgroundColor: bg }}
    >
      <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[24px] top-1/2">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={icon} />
      </div>
    </div>
  )
}

/** Scenario 1, scene 1 — the Google Meet in-call grid (Figma 666:658). */
export function MeetCall() {
  return (
    <div className="bg-white relative size-full">
      <BrowserChrome tabTitle="Meet - Kick off" urlHost="meet.google.com" urlPath="/uir-wmte-coi?authuser=2" />

      <div className="absolute bg-[#131314] h-[945px] left-0 overflow-clip top-[79px] w-[1440px]">
        {/* Clock row */}
        <div className="-translate-y-1/2 absolute flex flex-col font-medium justify-center leading-[0] left-[30px] text-[16px] text-white top-[41px] whitespace-nowrap" style={googleSans}>
          <p className="leading-[normal]">9:30 AM</p>
        </div>
        <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-normal justify-center leading-[0] left-[102.5px] text-[#9a9a9a] text-[16px] text-center top-[41px] whitespace-nowrap" style={googleSans}>
          <p className="leading-[normal]">|</p>
        </div>
        <div className="-translate-y-1/2 absolute flex flex-col font-medium justify-center leading-[0] left-[113px] text-[16px] text-white top-[41px] whitespace-nowrap" style={googleSans}>
          <p className="leading-[normal]">Kick off</p>
        </div>
        <div className="absolute left-[183px] size-[16px] top-[33px]">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={info} />
        </div>

        {/* 2×2 participant grid — all letter tiles, Meet's avatar palette. */}
        <div className="absolute gap-[12px] grid grid-cols-2 grid-rows-2 h-[790px] left-[30px] top-[69px] w-[1380px]">
          <AvatarTile name="Greg Bothman" letter="G" circle="#00838F" tint={[15, 54, 60]} />
          <AvatarTile
            name="Peek Designer"
            letter="P"
            circle="#7E57C2"
            tint={[50, 37, 76]}
            badge={micBadgeDesigner}
            badgeOpacity={0.33}
          />
          <AvatarTile
            name="Alice Curtis"
            letter="A"
            circle="#4058B9"
            tint={[44, 55, 99]}
            badge={micBadgeAlice}
          />
          <AvatarTile name="Stripe Engineer" letter="S" circle="#C26401" tint={[70, 43, 13]} />
        </div>

        {/* Center control bar */}
        <div className="absolute bg-[#1e1f20] flex gap-[8px] items-center left-[438px] overflow-clip p-[12px] rounded-[24px] top-[867px]">
          {/* Mic — muted (red split control) */}
          <div className="bg-[#601410] h-[48px] overflow-clip relative rounded-[12px] shrink-0 w-[88px]">
            <div className="-translate-y-1/2 absolute bg-[#f9dedc] overflow-clip right-0 rounded-[12px] size-[48px] top-1/2">
              <div className="absolute left-[12px] size-[24px] top-[12px]">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={micOff} />
              </div>
            </div>
            <div className="-translate-y-1/2 absolute left-[14px] size-[20px] top-1/2">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={moreAudio} />
            </div>
          </div>
          {/* Camera — on (pill split control) */}
          <div className="bg-[#282a2c] h-[48px] overflow-clip relative rounded-[100px] shrink-0 w-[88px]">
            <div className="-translate-y-1/2 absolute bg-[#333537] overflow-clip right-0 rounded-[100px] size-[48px] top-1/2">
              <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[24px] top-1/2">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={videocam} />
              </div>
            </div>
            <div className="-translate-y-1/2 absolute left-[14px] size-[20px] top-1/2">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={moreVideo} />
            </div>
          </div>
          <RoundControl icon={shareScreen} />
          <RoundControl icon={mood} />
          <RoundControl icon={closedCaption} />
          <RoundControl icon={backHand} />
          <RoundControl icon={moreVert} width={36} />
          <RoundControl icon={callEnd} width={72} bg="#dc362e" handle="hangup" />
        </div>

        {/* Right pill — chat + meeting tools */}
        <div className="absolute bg-[#1e1f20] flex items-center left-[1314px] rounded-[9999px] top-[879px]">
          <div className="overflow-clip relative rounded-[100px] shrink-0 size-[48px]">
            <div className="absolute left-[12px] size-[24px] top-[12px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={chat} />
            </div>
          </div>
          <div className="overflow-clip relative rounded-[100px] shrink-0 size-[48px]">
            <div className="absolute left-[12px] size-[24px] top-[12px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={lockPerson} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
