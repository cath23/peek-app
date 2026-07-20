/**
 * Local-development convenience: sign the demo user in automatically so you
 * don't retype credentials after every reseed (reseeding wipes the auth
 * tables, which invalidates the session).
 *
 * SAFETY — this can never run on a deployed instance:
 *   1. `import.meta.env.DEV` is true ONLY under `vite dev`. Vercel builds with
 *      `vite build`, where it is false and this whole branch is dead code that
 *      the bundler drops.
 *   2. It additionally requires an explicit `VITE_DEV_AUTOLOGIN=1` opt-in.
 *   3. Credentials come from `.env.local` (gitignored) — never from source.
 *
 * Signing out is respected: TopBar marks the session as opted-out so you don't
 * get instantly signed back in (needed for two-user testing).
 */

const OPT_OUT_KEY = 'peek.devAutoLogin.optOut'

export interface DevAutoLoginConfig {
  email: string
  password: string
}

/** Config when dev auto-login is enabled AND fully configured, else null. */
export const devAutoLogin: DevAutoLoginConfig | null = (() => {
  if (!import.meta.env.DEV) return null
  if (import.meta.env.VITE_DEV_AUTOLOGIN !== '1') return null
  const email = import.meta.env.VITE_DEV_AUTOLOGIN_EMAIL as string | undefined
  const password = import.meta.env.VITE_DEV_AUTOLOGIN_PASSWORD as string | undefined
  if (!email || !password) {
    console.warn(
      '[peek] VITE_DEV_AUTOLOGIN=1 but VITE_DEV_AUTOLOGIN_EMAIL/_PASSWORD are missing — showing the sign-in screen.',
    )
    return null
  }
  return { email, password }
})()

/** True once the user has deliberately signed out in this tab. */
export function isDevAutoLoginOptedOut(): boolean {
  try {
    return sessionStorage.getItem(OPT_OUT_KEY) === '1'
  } catch {
    return false
  }
}

/** Called from the sign-out action so auto-login doesn't fight the user. */
export function optOutOfDevAutoLogin() {
  try {
    sessionStorage.setItem(OPT_OUT_KEY, '1')
  } catch {
    // Storage unavailable — worst case auto-login re-runs; harmless in dev.
  }
}
