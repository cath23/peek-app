import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { hasConvex } from '@/api'
import { PeekLogoBadge } from '@/components/ui/PeekLogo'
import { AuthScreen } from './AuthScreen'
import { devAutoLogin, isDevAutoLoginOptedOut } from './devAutoLogin'

/**
 * Router-level auth gate (Phase 3). Convex mode: unauthenticated visitors
 * see the AuthScreen, the app renders only once authenticated. Mock mode
 * (tests, Storybook, checkouts without a deployment) has no identity
 * server — the app stays auto-signed-in as CURRENT_USER_NAME, unchanged.
 *
 * Local dev only: with `VITE_DEV_AUTOLOGIN=1` the demo user signs in
 * automatically instead of showing the screen (see ./devAutoLogin — it is
 * dead code in any production build).
 */
export function AuthGate({ children }: { children: ReactNode }) {
  if (!hasConvex) return <>{children}</>
  return (
    <>
      <AuthLoading>
        <AuthLoadingScreen />
      </AuthLoading>
      <Unauthenticated>
        {devAutoLogin ? <DevAutoSignIn /> : <AuthScreen />}
      </Unauthenticated>
      <Authenticated>{children}</Authenticated>
    </>
  )
}

/**
 * Signs the configured dev user in once per mount, then hands over to the
 * normal Authenticated branch. Falls back to the real sign-in screen if the
 * attempt fails (e.g. the account was wiped and not reseeded yet) or if the
 * user deliberately signed out in this tab.
 */
function DevAutoSignIn() {
  const { signIn } = useAuthActions()
  const [showScreen, setShowScreen] = useState(() => isDevAutoLoginOptedOut())
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current || showScreen || !devAutoLogin) return
    attempted.current = true
    void signIn('password', {
      email: devAutoLogin.email,
      password: devAutoLogin.password,
      flow: 'signIn',
    }).catch((err) => {
      console.warn('[peek] dev auto-login failed — falling back to the sign-in screen.', err)
      setShowScreen(true)
    })
  }, [signIn, showScreen])

  return showScreen ? <AuthScreen /> : <AuthLoadingScreen />
}

/** Blank canvas with a delayed pulsing badge — same 150ms-delayed-reveal
 *  philosophy as the skeletons (fast auth checks never flash it). */
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <PeekLogoBadge size={40} className="animate-skeleton-in animate-pulse" />
    </div>
  )
}
