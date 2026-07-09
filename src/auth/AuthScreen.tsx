import { useState, type FormEvent, type ReactNode } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { PeekLogoBadge } from '@/components/ui/PeekLogo'
import { TextInput } from '@/components/ui/TextInput'

/**
 * The unauthenticated surface (Phase 3): sign-in / sign-up / verify-email /
 * forgot-password as a plain page-level form column — badge mark, big
 * left-aligned heading, full-width primary action (user's design reference,
 * 2026-07-09). Email + password only (ruling 2026-07-08); sign-up collects
 * full name; verification and reset are 8-digit OTP codes (convex/otp.ts).
 */
type Mode = 'signIn' | 'signUp' | 'verify' | 'forgot' | 'resetVerify'

/** Convex Auth error → what the person should read. */
function friendlyError(mode: Mode, e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e)
  if (/InvalidSecret|InvalidAccountId/.test(raw)) return 'Incorrect email or password.'
  if (/already exists/i.test(raw)) return 'An account with this email already exists — sign in instead.'
  if (/Invalid password/i.test(raw)) return 'Password must be at least 8 characters.'
  if (/Could not verify|verification code/i.test(raw) || mode === 'verify' || mode === 'resetVerify')
    return 'That code didn’t work — check it and try again.'
  return 'Something went wrong — please try again.'
}

/** Page-level form column per the design reference: badge mark above a
 *  left-aligned heading, fields, full-width primary action — no card chrome,
 *  straight on the canvas. */
function AuthCard({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
      <div className="w-[400px] max-w-full flex flex-col">
        <PeekLogoBadge size={40} />
        <h1 className="text-h1 text-text-primary mt-8">{title}</h1>
        {hint && <p className="text-body-2 text-text-secondary mt-2">{hint}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </div>
  )
}

export function AuthScreen() {
  const { signIn } = useAuthActions()
  const [mode, setMode] = useState<Mode>('signIn')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
    setCode('')
  }

  const run = async (fn: () => Promise<void>) => {
    setError(null)
    setPending(true)
    try {
      await fn()
    } catch (e) {
      setError(friendlyError(mode, e))
    } finally {
      setPending(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (pending) return
    if (mode === 'signIn') {
      void run(async () => {
        const result = await signIn('password', { email, password, flow: 'signIn' })
        // Unverified account: a fresh code was emailed; finish verification.
        if (!result.signingIn) switchMode('verify')
      })
    } else if (mode === 'signUp') {
      void run(async () => {
        const result = await signIn('password', { email, password, name, flow: 'signUp' })
        if (!result.signingIn) switchMode('verify')
      })
    } else if (mode === 'verify') {
      void run(async () => {
        await signIn('password', { email, code, flow: 'email-verification' })
      })
    } else if (mode === 'forgot') {
      void run(async () => {
        await signIn('password', { email, flow: 'reset' })
        switchMode('resetVerify')
      })
    } else {
      void run(async () => {
        await signIn('password', { email, code, newPassword, flow: 'reset-verification' })
      })
    }
  }

  const errorRow = error && <p className="text-caption text-error-default">{error}</p>

  // Text-only actions reuse the Button primitive (muted = the system's
  // text button), per design review 2026-07-09.
  const footerLink = (label: string, action: () => void) => (
    <Button variant="muted" size="small" type="button" onClick={action}>
      {label}
    </Button>
  )

  if (mode === 'verify' || mode === 'resetVerify') {
    return (
      <AuthCard
        title={mode === 'verify' ? 'Check your email' : 'Choose a new password'}
        hint={`We sent an 8-digit code to ${email}. It expires in 15 minutes.`}
      >
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <Field label="Code" required>
            <TextInput
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="12345678"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </Field>
          {mode === 'resetVerify' && (
            <Field label="New password" required>
              <TextInput
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Field>
          )}
          {errorRow}
          <Button variant="primary" className="w-full h-10" disabled={pending || !code} type="submit">
            {mode === 'verify' ? 'Verify' : 'Reset password'}
          </Button>
          <div className="flex justify-center">{footerLink('Start over', () => switchMode('signIn'))}</div>
        </form>
      </AuthCard>
    )
  }

  if (mode === 'forgot') {
    return (
      <AuthCard title="Reset your password" hint="Enter your email and we’ll send you a code.">
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <Field label="Email" required>
            <TextInput
              autoFocus
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          {errorRow}
          <Button variant="primary" className="w-full h-10" disabled={pending || !email} type="submit">
            Send code
          </Button>
          <div className="flex justify-center">{footerLink('Back to sign in', () => switchMode('signIn'))}</div>
        </form>
      </AuthCard>
    )
  }

  const isSignUp = mode === 'signUp'
  return (
    <AuthCard title={isSignUp ? 'Sign up' : 'Sign in'}>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        {isSignUp && (
          <Field label="Full name" required>
            <TextInput
              autoFocus
              autoComplete="name"
              placeholder="Ada Lovelace"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        )}
        <Field label="Email" required>
          <TextInput
            autoFocus={!isSignUp}
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" required>
          <TextInput
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            placeholder={isSignUp ? 'At least 8 characters' : '••••••••'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {errorRow}
        <Button
          variant="primary"
          className="w-full h-10"
          disabled={pending || !email || !password || (isSignUp && !name)}
          type="submit"
        >
          {isSignUp ? 'Sign up' : 'Sign in'}
        </Button>
        <div className="flex items-center justify-between">
          {footerLink(
            isSignUp ? 'Have an account? Sign in' : 'No account? Sign up',
            () => switchMode(isSignUp ? 'signIn' : 'signUp'),
          )}
          {!isSignUp && footerLink('Forgot password?', () => switchMode('forgot'))}
        </div>
      </form>
    </AuthCard>
  )
}
