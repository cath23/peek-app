/**
 * Convex Auth (Phase 3): email + password. Sign-up collects email +
 * password + full name (decision 2026-07-09) and signs the user straight
 * in — no email verification and no password reset for now (decision
 * 2026-07-09: they require an email-sending service; deferred to Phase 5
 * — the OTP providers live in git history at 737a9fb). No OAuth providers
 * yet (ruling 2026-07-08: email+password first).
 */
import { convexAuth } from '@convex-dev/auth/server'
import { Password } from '@convex-dev/auth/providers/Password'

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
        }
      },
    }),
  ],
})
