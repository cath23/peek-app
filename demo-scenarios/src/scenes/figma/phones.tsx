import type { ReactNode } from 'react'
import wifi from '../../assets/figma/phone-wifi.svg'
import battery from '../../assets/figma/phone-battery.svg'
import spinnerDark from '../../assets/figma/spinner-dark.svg'
import spinnerIndigo from '../../assets/figma/spinner-indigo.svg'
import checkGreen from '../../assets/figma/check-green.svg'
import xRed from '../../assets/figma/x-red.svg'
import billingIcon from '../../assets/figma/billing-icon.svg'
import cardIcon from '../../assets/figma/card-icon.svg'
import lockIcon from '../../assets/figma/lock-icon.svg'

// The six payment-flow drafts on the Figma canvas, hand-built pixel-perfect
// from the mock (Figma 813:14723…14901). All at the mock's canvas scale:
// 201.5 × 436 — a 390-wide phone drawn at 51.67%.

export const PHONE_W = 201.5
export const PHONE_H = 436.0667

const geistMono = { fontFamily: "'Geist Mono', monospace" }

function StatusBar() {
  return (
    <div className="content-stretch flex items-center overflow-clip pb-[3.1px] pt-[7.233px] px-[12.4px] relative shrink-0 w-full">
      <p className="font-semibold leading-[normal] relative shrink-0 text-[#09090b] text-[7.233px] whitespace-nowrap">9:41</p>
      <div className="flex-[1_0_0] h-[0.517px] min-w-px relative" />
      <div className="content-stretch flex gap-[2.583px] items-center overflow-clip relative shrink-0">
        <img alt="" className="block h-[5.683px] w-[8.267px] shrink-0" src={wifi} />
        <img alt="" className="block h-[6.2px] w-[12.917px] shrink-0" src={battery} />
      </div>
    </div>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div
      className="bg-white content-stretch flex flex-col items-start relative"
      style={{ width: PHONE_W, height: PHONE_H, border: '0.517px solid #e4e4e7' }}
    >
      <StatusBar />
      {children}
    </div>
  )
}

export function PhoneBilling() {
  return (
    <Shell>
      <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px overflow-clip pb-[12.4px] pt-[4.133px] px-[10.333px] relative w-full">
        <div className="content-stretch flex gap-[6.2px] items-center overflow-clip pb-[9.3px] pt-[4.133px] relative shrink-0 w-full">
          <img alt="" className="block size-[10.333px] shrink-0" src={billingIcon} />
          <p className="font-semibold leading-[normal] relative shrink-0 text-[#09090b] text-[8.783px] whitespace-nowrap">Billing</p>
        </div>
        <div className="bg-white content-stretch flex flex-col gap-[4.133px] items-start overflow-clip p-[8.267px] relative rounded-[5.167px] shadow-[0px_0.517px_1.033px_0px_rgba(0,0,0,0.04)] shrink-0 w-full" style={{ border: '0.517px solid #e4e4e7' }}>
          <div className="content-stretch flex gap-[4.133px] items-start overflow-clip relative shrink-0 w-full">
            <p className="font-medium leading-[normal] relative shrink-0 text-[#09090b] text-[7.75px] whitespace-nowrap">Workspace plan</p>
            <div className="flex-[1_0_0] h-[0.517px] min-w-px relative" />
            <p className="font-medium leading-[normal] relative shrink-0 text-[#09090b] text-[7.75px] whitespace-nowrap">$96.00 / mo</p>
          </div>
          <p className="font-normal leading-[normal] relative shrink-0 text-[#52525b] text-[6.717px] whitespace-nowrap">8 members · $12 per member · billed monthly</p>
        </div>
        <div className="h-[7.233px] shrink-0 w-[5.167px]" />
        <div className="bg-white content-stretch flex flex-col gap-[5.167px] items-start overflow-clip p-[8.267px] relative rounded-[5.167px] shadow-[0px_0.517px_1.033px_0px_rgba(0,0,0,0.04)] shrink-0 w-full" style={{ border: '0.517px solid #e4e4e7' }}>
          <p className="font-medium leading-[normal] relative shrink-0 text-[#09090b] text-[7.233px] whitespace-nowrap">Payment method</p>
          <div className="bg-[#fafafa] content-stretch flex gap-[5.167px] items-center overflow-clip px-[6.2px] py-[7.233px] relative rounded-[4.133px] shrink-0 w-full" style={{ border: '0.517px dashed #e4e4e7' }}>
            <img alt="" className="block h-[8.267px] w-[11.367px] shrink-0" src={cardIcon} />
            <p className="font-normal leading-[normal] relative shrink-0 text-[#a1a1aa] text-[6.975px] whitespace-nowrap">No payment method on file</p>
          </div>
        </div>
        <div className="h-[10.333px] shrink-0 w-[5.167px]" />
        <div className="bg-[#18181b] content-stretch flex h-[22.733px] items-center justify-center overflow-clip relative rounded-[4.133px] shrink-0 w-full">
          <p className="font-medium leading-[normal] relative shrink-0 text-[7.75px] text-white whitespace-nowrap">Add payment method</p>
        </div>
        <div className="h-[6.2px] shrink-0 w-[5.167px]" />
        <div className="content-stretch flex gap-[2.583px] items-center justify-center overflow-clip relative shrink-0 w-full">
          <img alt="" className="block h-[6.717px] w-[5.683px] shrink-0" src={lockIcon} />
          <p className="font-normal leading-[normal] relative shrink-0 text-[#71717a] text-[6.2px] whitespace-nowrap">Secure checkout by Stripe</p>
        </div>
      </div>
    </Shell>
  )
}

export function PhoneHandoff() {
  return (
    <Shell>
      <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px overflow-clip pb-[12.4px] pt-[4.133px] px-[10.333px] relative w-full">
        <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px overflow-clip relative w-full">
          <img alt="" className="block size-[22.733px] shrink-0" src={spinnerIndigo} />
          <div className="h-[12.4px] shrink-0 w-[5.167px]" />
          <p className="font-semibold leading-[normal] relative shrink-0 text-[#09090b] text-[9.3px] whitespace-nowrap">Taking you to Stripe</p>
          <div className="h-[4.133px] shrink-0 w-[5.167px]" />
          <p className="font-normal leading-[1.5] min-w-full relative shrink-0 text-[#52525b] text-[7.233px] text-center w-[min-content]">
            You'll complete payment on Stripe's secure page, then come right back.
          </p>
        </div>
      </div>
    </Shell>
  )
}

export function PhoneConfirming() {
  return (
    <Shell>
      <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px overflow-clip pb-[12.4px] pt-[4.133px] px-[10.333px] relative w-full">
        <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px overflow-clip relative w-full">
          <img alt="" className="block size-[22.733px] shrink-0" src={spinnerDark} />
          <div className="h-[12.4px] shrink-0 w-[5.167px]" />
          <p className="font-semibold leading-[normal] relative shrink-0 text-[#09090b] text-[9.3px] whitespace-nowrap">Confirming your payment</p>
          <div className="h-[4.133px] shrink-0 w-[5.167px]" />
          <p className="font-normal leading-[1.5] min-w-full relative shrink-0 text-[#52525b] text-[7.233px] text-center w-[min-content]">
            We're checking with Stripe. This can take a few seconds — keep this screen open.
          </p>
          <div className="h-[13.433px] shrink-0 w-[5.167px]" />
          <div className="bg-[#f4f4f5] content-stretch flex gap-[4.133px] items-center leading-[normal] overflow-clip px-[7.233px] py-[4.65px] relative rounded-full shrink-0 text-[6.717px] whitespace-nowrap">
            <p className="relative shrink-0 text-[#09090b]" style={geistMono}>$96.00</p>
            <p className="relative shrink-0 text-[#a1a1aa]">·</p>
            <p className="relative shrink-0 text-[#52525b]" style={geistMono}>Visa •••• 4242</p>
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function PhoneSuccess() {
  return (
    <Shell>
      <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px overflow-clip pb-[12.4px] pt-[4.133px] px-[10.333px] relative w-full">
        <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px overflow-clip relative w-full">
          <div className="bg-[rgba(15,184,130,0.12)] overflow-clip relative rounded-full shrink-0 size-[28.933px]">
            <img alt="" className="absolute block left-[8.27px] size-[12.4px] top-[8.27px]" src={checkGreen} />
          </div>
          <div className="h-[11.367px] shrink-0 w-[5.167px]" />
          <p className="font-semibold leading-[normal] relative shrink-0 text-[#09090b] text-[10.333px] whitespace-nowrap">You're all set</p>
          <div className="h-[4.133px] shrink-0 w-[5.167px]" />
          <p className="font-normal leading-[1.5] min-w-full relative shrink-0 text-[#52525b] text-[7.233px] text-center w-[min-content]">
            Billing is active for your workspace. A receipt is on its way to billing@peek.dev.
          </p>
          <div className="h-[12.4px] shrink-0 w-[5.167px]" />
          <div className="bg-white content-stretch flex flex-col gap-[5.167px] items-start overflow-clip px-[8.267px] py-[7.233px] relative rounded-[5.167px] shrink-0 w-full" style={{ border: '0.517px solid #e4e4e7' }}>
            {[
              ['Amount', '$96.00'],
              ['Payment method', 'Visa •••• 4242'],
              ['Next invoice', 'Aug 1, 2026'],
            ].map(([k, v]) => (
              <div key={k} className="content-stretch flex gap-[4.133px] items-start overflow-clip relative shrink-0 w-full">
                <p className="font-normal leading-[normal] relative shrink-0 text-[#52525b] text-[6.717px] whitespace-nowrap">{k}</p>
                <div className="flex-[1_0_0] h-[0.517px] min-w-px relative" />
                <p className="font-normal leading-[normal] relative shrink-0 text-[#09090b] text-[6.717px] whitespace-nowrap" style={geistMono}>{v}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#18181b] content-stretch flex h-[22.733px] items-center justify-center overflow-clip relative rounded-[4.133px] shrink-0 w-full">
          <p className="font-medium leading-[normal] relative shrink-0 text-[7.75px] text-white whitespace-nowrap">Back to workspace</p>
        </div>
      </div>
    </Shell>
  )
}

export function PhoneFailed() {
  return (
    <Shell>
      <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px overflow-clip pb-[12.4px] pt-[4.133px] px-[10.333px] relative w-full">
        <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px overflow-clip relative w-full">
          <div className="bg-[rgba(240,69,69,0.1)] overflow-clip relative rounded-full shrink-0 size-[28.933px]">
            <img alt="" className="absolute block left-[8.27px] size-[12.4px] top-[8.27px]" src={xRed} />
          </div>
          <div className="h-[11.367px] shrink-0 w-[5.167px]" />
          <p className="font-semibold leading-[normal] relative shrink-0 text-[#09090b] text-[10.333px] whitespace-nowrap">Something went wrong</p>
          <div className="h-[4.133px] shrink-0 w-[5.167px]" />
          <p className="font-normal leading-[1.5] min-w-full relative shrink-0 text-[#52525b] text-[7.233px] text-center w-[min-content]">
            Your payment could not be processed.
          </p>
        </div>
        <div className="bg-[#18181b] content-stretch flex h-[22.733px] items-center justify-center overflow-clip relative rounded-[4.133px] shrink-0 w-full">
          <p className="font-medium leading-[normal] relative shrink-0 text-[7.75px] text-white whitespace-nowrap">Try again</p>
        </div>
      </div>
    </Shell>
  )
}

export function Phone3dsTodo() {
  return (
    <Shell>
      <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px overflow-clip pb-[12.4px] pt-[4.133px] px-[10.333px] relative w-full">
        <div className="size-[5.167px] shrink-0" />
        <p className="font-semibold leading-[normal] relative shrink-0 text-[#09090b] text-[8.783px] whitespace-nowrap">3DS declined</p>
        <div className="h-[8.267px] shrink-0 w-[5.167px]" />
        <div className="bg-[#fafafa] content-stretch flex flex-[1_0_0] flex-col gap-[4.133px] items-center justify-center leading-[normal] min-h-px overflow-clip relative rounded-[6.2px] text-[#a1a1aa] w-full whitespace-nowrap" style={{ border: '0.775px dashed #d4d4d8' }}>
          <p className="font-medium relative shrink-0 text-[7.75px]">todo</p>
          <p className="font-normal relative shrink-0 text-[6.717px]">what does the customer see here?</p>
        </div>
      </div>
    </Shell>
  )
}
