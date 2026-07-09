import { type ReactNode } from 'react'
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react'
import { hasConvex } from '@/api'
import { PeekLogoBadge } from '@/components/ui/PeekLogo'
import { AuthScreen } from './AuthScreen'

/**
 * Router-level auth gate (Phase 3). Convex mode: unauthenticated visitors
 * see the AuthScreen, the app renders only once authenticated. Mock mode
 * (tests, Storybook, checkouts without a deployment) has no identity
 * server — the app stays auto-signed-in as CURRENT_USER_NAME, unchanged.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  if (!hasConvex) return <>{children}</>
  return (
    <>
      <AuthLoading>
        <AuthLoadingScreen />
      </AuthLoading>
      <Unauthenticated>
        <AuthScreen />
      </Unauthenticated>
      <Authenticated>{children}</Authenticated>
    </>
  )
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
