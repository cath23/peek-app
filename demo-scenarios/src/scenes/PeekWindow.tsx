import { BrowserChrome } from './BrowserChrome'
import { Window } from './Window'
import peekFavicon from '../assets/meet/peek-favicon.svg'
import { peekSrc, type FrameLink } from '../lib/frames'
import { CHROME_H, VIEW_H, VIEW_W } from '../lib/stage'

/**
 * Peek — the real app in a browser window, rising into frame at the end of the
 * film. Its highlights card starts hidden (the bridge does that), so the topic
 * reads as empty right up until the floating card lands in it.
 */
export function PeekWindow({ frame }: { frame: FrameLink }) {
  return (
    <div data-layer="peek" className="absolute inset-0" style={{ opacity: 0 }}>
      <Window>
        <div className="bg-[#131314] relative size-full">
          <BrowserChrome
            tabTitle="Payment integration"
            urlHost="app.peek.com"
            urlPath="/topics/payment-integration"
            favicon={peekFavicon}
          />
          <div
            className="absolute left-0 overflow-clip"
            style={{ top: CHROME_H, width: VIEW_W, height: VIEW_H, backgroundColor: '#12151a' }}
          >
            {/* pointer-events: none keeps clicks on the stage and keyboard focus
                out of the iframe, so playback controls never stop responding. */}
            <iframe
              ref={frame.ref}
              title="Peek"
              src={peekSrc('app')}
              width={VIEW_W}
              height={VIEW_H}
              style={{ border: 0, display: 'block', pointerEvents: 'none' }}
            />
          </div>
        </div>
      </Window>
    </div>
  )
}
