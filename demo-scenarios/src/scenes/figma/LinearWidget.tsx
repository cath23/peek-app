import linearLogo from '../../assets/figma/linear-logo.svg'
import statusInProgress from '../../assets/figma/status-inprogress.svg'
import issueDone from '../../assets/figma/issue-done.svg'
import issueInProgress from '../../assets/figma/issue-inprogress.svg'
import issueTodo from '../../assets/figma/issue-todo.svg'
import widgetAvatar from '../../assets/figma/widget-avatar.jpg'

const inter = { fontFamily: "'Inter', sans-serif" }

// The live Linear project widget pinned to the canvas like a sticky note
// (Figma 823:14925, "linear-widget/sticky-hybrid"): project header, one-line
// description, and the four design issues.

export const LINEAR_WIDGET_W = 380
export const LINEAR_WIDGET_H = 226

const ISSUES: { icon: string; id: string; title: string; done?: boolean }[] = [
  { icon: issueDone, id: 'PEE-127', title: 'Billing entry + add payment method', done: true },
  { icon: issueInProgress, id: 'PEE-128', title: 'Draft the mobile payment flow' },
  { icon: issueTodo, id: 'PEE-129', title: 'Failure + 3DS declined states' },
  { icon: issueTodo, id: 'PEE-130', title: 'Empty payment-method state' },
]

export function LinearWidget() {
  return (
    <div
      className="bg-[#151516] content-stretch flex flex-col items-start overflow-clip relative rounded-[8px] shadow-[0px_2px_4px_-2px_rgba(0,0,0,0.3),0px_4px_6px_-1px_rgba(0,0,0,0.4)]"
      style={{ ...inter, width: LINEAR_WIDGET_W, border: '1px solid #2d2d31' }}
    >
      <div className="bg-[#2e2554] content-stretch flex gap-[8px] h-[34px] items-center overflow-clip px-[14px] relative shrink-0 w-full">
        <img alt="" className="block size-[14px] shrink-0" src={linearLogo} />
        <p className="font-semibold leading-[normal] relative shrink-0 text-[#ddd6fe] text-[12px] whitespace-nowrap">Payment integration</p>
        <div className="flex-[1_0_0] h-px min-w-px relative" />
        <div className="content-stretch flex gap-[4px] items-center overflow-clip relative shrink-0">
          <img alt="" className="block size-[11px] shrink-0" src={statusInProgress} />
          <p className="font-medium leading-[normal] relative shrink-0 text-[#a78bfa] text-[10.5px] whitespace-nowrap">In Progress</p>
        </div>
      </div>
      <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full">
        <div className="content-stretch flex items-start overflow-clip pb-[6px] pt-[10px] px-[16px] relative shrink-0 w-full">
          <p className="flex-[1_0_0] font-normal leading-[1.5] min-w-px relative text-[#8a8f98] text-[12px]">
            Stripe Checkout for workspace billing - redirect flow, no custom card form.
          </p>
        </div>
        {ISSUES.map((issue, i) => (
          <div
            key={issue.id}
            className="content-stretch flex gap-[9px] items-center overflow-clip px-[16px] relative shrink-0 w-full"
            style={{ paddingTop: 8, paddingBottom: i === ISSUES.length - 1 ? 12 : 8 }}
          >
            <img alt="" className="block size-[14px] shrink-0" src={issue.icon} />
            <p className="font-normal leading-[normal] relative shrink-0 text-[#62666d] text-[10.5px] whitespace-nowrap" style={{ fontFamily: "'Geist Mono', monospace" }}>
              {issue.id}
            </p>
            <p
              className="flex-[1_0_0] font-normal leading-[normal] min-w-px relative text-[12.5px]"
              style={{ color: issue.done ? '#8a8f98' : '#eeeff1', textDecoration: issue.done ? 'line-through' : 'none' }}
            >
              {issue.title}
            </p>
            <img alt="" className="block rounded-full shrink-0 size-[18px] object-cover" src={widgetAvatar} />
          </div>
        ))}
      </div>
    </div>
  )
}

// The compact customer-feedback widget — the same Linear-widget family at chat
// size. Three of these cascade into the AI reply, and one leads the opened
// canvas comment. Not in the mock: designed to the sticky-hybrid's tokens
// (user ruling: widgets over a table / plain text).

export interface FeedbackItem {
  title: string
  customer: string
  id: string
}

export const FEEDBACK: FeedbackItem[] = [
  { title: 'Payment declined with no reason shown', customer: 'Acme', id: 'LIN-482' },
  { title: 'Stuck on a blank screen after 3DS check', customer: 'Northwind', id: 'LIN-517' },
  { title: 'No way to change card after a failure', customer: 'Globex', id: 'LIN-533' },
]

export function FeedbackWidget({ item, width }: { item: FeedbackItem; width?: number }) {
  return (
    <div
      className="bg-[#151516] content-stretch flex flex-col gap-[3px] items-start overflow-clip px-[10px] py-[7px] relative rounded-[6px]"
      style={{ ...inter, width: width ?? 283, border: '1px solid #2d2d31' }}
    >
      <p className="font-medium leading-[normal] relative shrink-0 text-[#eeeff1] text-[11.5px] whitespace-nowrap overflow-hidden text-ellipsis w-full">
        “{item.title}”
      </p>
      <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full">
        <img alt="" className="block size-[10px] shrink-0" src={linearLogo} />
        <p className="font-normal leading-[normal] relative shrink-0 text-[#8a8f98] text-[10px] whitespace-nowrap">{item.customer}</p>
        <p className="font-normal leading-[normal] relative shrink-0 text-[#62666d] text-[10px] whitespace-nowrap" style={{ fontFamily: "'Geist Mono', monospace" }}>
          {item.id}
        </p>
      </div>
    </div>
  )
}
