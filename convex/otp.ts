/**
 * Email OTP providers for the Password flow (Phase 3): sign-up email
 * verification and password reset, both 8-digit codes sent via Resend.
 *
 * DEV FALLBACK: when RESEND_API_KEY is not set on the deployment, the
 * code is logged to the Convex dashboard logs instead of emailed, so the
 * flows stay testable before the key is provisioned. With Resend's free
 * test sender (onboarding@resend.dev) emails only deliver to the Resend
 * account owner's address; a verified domain is a Phase 5 item.
 */
import Resend from '@auth/core/providers/resend'

function generateCode(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => String(b % 10)).join('')
}

async function sendCode(kind: 'verify' | 'reset', email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn(`[otp] RESEND_API_KEY not set — DEV fallback. ${kind} code for ${email}: ${code}`)
    return
  }
  const subject = kind === 'verify' ? `${code} — verify your email for Peek` : `${code} — reset your Peek password`
  const text =
    kind === 'verify'
      ? `Your Peek verification code is ${code}\n\nEnter it in the app to finish signing up. The code expires in 15 minutes.`
      : `Your Peek password reset code is ${code}\n\nEnter it in the app to choose a new password. The code expires in 15 minutes.`
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Peek <onboarding@resend.dev>', to: [email], subject, text }),
  })
  if (!res.ok) {
    throw new Error(`Could not send ${kind} email: ${res.status} ${await res.text()}`)
  }
}

export const ResendOTPVerify = Resend({
  id: 'resend-otp-verify',
  apiKey: process.env.RESEND_API_KEY,
  maxAge: 60 * 15,
  async generateVerificationToken() {
    return generateCode()
  },
  async sendVerificationRequest({ identifier: email, token }) {
    await sendCode('verify', email, token)
  },
})

export const ResendOTPPasswordReset = Resend({
  id: 'resend-otp-reset',
  apiKey: process.env.RESEND_API_KEY,
  maxAge: 60 * 15,
  async generateVerificationToken() {
    return generateCode()
  },
  async sendVerificationRequest({ identifier: email, token }) {
    await sendCode('reset', email, token)
  },
})
