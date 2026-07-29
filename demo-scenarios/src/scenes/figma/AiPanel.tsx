import headerControls from '../../assets/figma/modal-header-controls.png'
import inputLeft from '../../assets/figma/modal-input-left.png'
import inputAsk from '../../assets/figma/modal-input-a.png'
import avatarUser from '../../assets/figma/avatar-user.jpg'
import sparkIcon from '../../assets/figma/spark-icon.svg'
import { FEEDBACK, FeedbackWidget } from './LinearWidget'

const inter = { fontFamily: "'Inter', sans-serif" }

// The Figma AI panel (mock 813:14684), floating over the canvas bottom-right.
// Every stage of the conversation exists in the DOM from frame 0 — the ask
// being typed, the sent bubble, the sub-agent shimmer, the reply — and the
// timeline reveals them in order. One element per stage, so scrubbing
// backwards un-sends the message for free.
//
// Two titles because the chat is born nameless: "New chat" until the ask is
// sent, then the AI names it. Two shimmer lines because the shine passes one
// row at a time (ruling) — the mock itself draws them as two gradient nodes.

export const AI_PANEL_W = 361
export const AI_PANEL_H = 415
/** Window-local position (the mock puts it at 976, 470 inside the app area). */
export const AI_PANEL_X = 976
export const AI_PANEL_Y = 470

export const ASK_TEXT =
  "I've finished the first draft. Review it based on any relevant customer feedback."

const shimmerStyle = {
  color: 'transparent',
  background: 'linear-gradient(100deg, #686868 38%, #d7d7d7 50%, #686868 62%)',
  backgroundSize: '250% 100%',
  backgroundPosition: '100% 0',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
} as const

export function AiPanel() {
  return (
    <div
      data-ai-panel
      className="absolute bg-[#2c2c2c] overflow-clip rounded-[16px] shadow-[0px_4px_6px_-4px_rgba(0,0,0,0.4),0px_10px_15px_-3px_rgba(0,0,0,0.5)]"
      style={{ ...inter, left: AI_PANEL_X, top: AI_PANEL_Y, width: AI_PANEL_W, height: AI_PANEL_H, border: '1px solid #494949' }}
    >
      {/* Header — the chat is renamed after the ask is sent. */}
      <p data-ai-title-new className="absolute font-medium leading-[normal] text-[13px] text-white tracking-[0.2px] whitespace-nowrap" style={{ left: 15, top: 12 }}>
        New chat
      </p>
      <p data-ai-title-named className="absolute font-medium leading-[normal] text-[13px] text-white tracking-[0.2px] whitespace-nowrap" style={{ left: 15, top: 12 }}>
        Request for feedback on draft
      </p>
      <img alt="" className="absolute block" src={headerControls} style={{ left: 299, top: 10, width: 46, height: 22 }} />
      <div className="absolute bg-[#494949]" style={{ left: 0, top: 40, width: '100%', height: 1 }} />

      {/* The sent ask: bubble + author. Hidden until the send. */}
      <div data-ai-bubble className="absolute" style={{ left: 15, top: 55, width: 331 }}>
        <div className="bg-[#383838] flex items-center justify-center p-[8px] rounded-[16px]" style={{ width: 299 }}>
          <p className="flex-[1_0_0] font-medium leading-[normal] min-w-px text-[#f4f4f4] text-[13px] tracking-[0.2px]">{ASK_TEXT}</p>
        </div>
        <img
          alt=""
          className="absolute block rounded-full object-cover"
          src={avatarUser}
          style={{ left: 307, bottom: 0, width: 24, height: 24, border: '1px solid #494949' }}
        />
      </div>

      {/* The sub-agent moment: spinning spark + two lines the shine passes
          one after the other. Disappears when the answer lands. */}
      <div data-ai-status className="absolute flex gap-[3px] items-start" style={{ left: 15, top: 123, width: 300 }}>
        <img data-ai-spark alt="" className="block shrink-0" src={sparkIcon} style={{ width: 16, height: 16 }} />
        <div className="font-medium leading-[1.25] text-[13px] tracking-[0.2px]" style={{ width: 283 }}>
          <p data-ai-shim1 style={shimmerStyle}>Asking Linear sub-agent for relevant</p>
          <p data-ai-shim2 style={shimmerStyle}>customer feedback…</p>
        </div>
      </div>

      {/* The answer, replacing the thinking: the line first, then the three
          feedback widgets below it (ruling). */}
      <div data-ai-reply className="absolute flex flex-col gap-[8px] items-start" style={{ left: 15, top: 123, width: 283 }}>
        <p data-ai-replyline className="font-medium leading-[normal] text-[#f4f4f4] text-[13px] tracking-[0.2px]">
          I've left 3 comments on the canvas:
        </p>
        {FEEDBACK.map((item) => (
          <div data-ai-fb key={item.id}>
            <FeedbackWidget item={item} />
          </div>
        ))}
      </div>

      {/* Input, anchored to the bottom edge; it grows upward while the ask is
          being typed and snaps back to one line on send. */}
      <div data-ai-inputblock className="absolute flex items-end" style={{ left: 0, right: 0, bottom: 0, minHeight: 48, borderTop: '1px solid #494949' }}>
        <img alt="" className="block shrink-0" src={inputLeft} style={{ width: 30, height: 28, margin: '0 0 10px 7px' }} />
        <div className="flex-1 relative" style={{ padding: '15px 0 15px 3px', minHeight: 48 }}>
          <p data-ai-placeholder className="absolute font-normal leading-[normal] text-[#808080] text-[13px] tracking-[0.2px]" style={{ left: 3, bottom: 15 }}>
            Describe your idea
          </p>
          <p className="font-normal leading-[1.35] text-[#f4f4f4] text-[13px] tracking-[0.2px]" style={{ minHeight: 18 }}>
            <span data-ai-input-text />
            <span
              data-ai-caret
              className="inline-block align-[-2px] bg-[#f4f4f4]"
              style={{ width: 1.5, height: 14, marginLeft: 1, opacity: 0 }}
            />
          </p>
        </div>
        <div className="flex items-center shrink-0" style={{ gap: 6, margin: '0 12px 10px 0' }}>
          <img alt="" className="block" src={inputAsk} style={{ width: 28, height: 38, margin: '5px 0 -5px 0' }} />
          {/* Disabled until there is something to send — the timeline turns
              it blue on the first typed character and grey again on clear. */}
          <div
            data-ai-send
            className="flex items-center justify-center rounded-full"
            style={{ width: 28, height: 28, background: '#4e4e4e' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path data-ai-send-arrow d="M6 10V2M2.5 5.5L6 2L9.5 5.5" stroke="#9e9e9e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
