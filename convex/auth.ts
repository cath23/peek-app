/**
 * Convex Auth (Phase 3): email + password with mandatory email
 * verification and password reset, both via 8-digit OTP codes
 * (convex/otp.ts). No OAuth providers yet (user ruling 2026-07-08:
 * email+password first; Google may come later).
 *
 * Sign-up collects email + password + full name (decision 2026-07-09);
 * `profile` stamps the name onto the user document.
 */
import { convexAuth } from '@convex-dev/auth/server'
import { Password } from '@convex-dev/auth/providers/Password'
import { ResendOTPVerify, ResendOTPPasswordReset } from './otp'

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      verify: ResendOTPVerify,
      reset: ResendOTPPasswordReset,
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
        }
      },
    }),
  ],
})
