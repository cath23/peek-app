/**
 * Avatar resolution — one lookup for the whole app.
 *
 * Precedence: an uploaded avatar (Convex file storage) wins; otherwise the
 * seeded demo portrait for that name (keeps the demo dataset
 * pixel-identical); otherwise nothing, and `Avatar` draws the silhouette.
 *
 * It is a context with a MOCK DEFAULT rather than a required provider, so
 * `Avatar` stays a dumb primitive: Storybook and unit tests render it with
 * no provider and still get the mock portraits, exactly as before.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { avatarFor } from '@/data/peopleData'
import { demoMode } from '@/demo/demoMode'
import { DEMO_EXTRA_PEOPLE, DEMO_VIEWER_AVATAR } from '@/demo/scenario1'
import { CURRENT_USER_NAME, useCurrentUser } from './currentUser'
import { usePeople } from './people'
import { hasConvex } from './store'

export type AvatarLookup = (name: string | undefined) => string | undefined

/**
 * Demo mode: the viewer wears the scenario protagonist's portrait instead of
 * the fixture's own, and the scenario's extra cast resolve (scenario1.ts).
 */
const demoAvatarFor: AvatarLookup = (name) => {
  if (name === CURRENT_USER_NAME) return DEMO_VIEWER_AVATAR
  const extra = DEMO_EXTRA_PEOPLE.find((p) => p.name === name)
  return extra?.avatarSrc ?? avatarFor(name)
}

const mockAvatarFor: AvatarLookup = demoMode ? demoAvatarFor : avatarFor

/** No provider (Storybook, tests) → the static name-keyed mock portraits. */
const AvatarContext = createContext<AvatarLookup>(mockAvatarFor)

/** Seam-internal: mounted by PeekDataProvider. */
export function AvatarRegistryProvider({ children }: { children: ReactNode }) {
  const me = useCurrentUser()
  const people = usePeople()

  const lookup = useMemo<AvatarLookup>(() => {
    if (!hasConvex) return mockAvatarFor
    const byName = new Map((people ?? []).map((p) => [p.name, p.avatarSrc]))
    return (name) => {
      if (!name) return undefined
      if (name === CURRENT_USER_NAME) {
        // The viewer. A real sign-up with no upload gets the silhouette —
        // never the demo fixture's portrait; the seed user keeps hers.
        return me?.avatarUrl ?? (me?.seedKey === 'you' ? avatarFor(CURRENT_USER_NAME) : undefined)
      }
      return byName.get(name) ?? avatarFor(name)
    }
  }, [me, people])

  return <AvatarContext.Provider value={lookup}>{children}</AvatarContext.Provider>
}

/** Resolve an author/person name to an avatar URL. */
export function useAvatarSrc(): AvatarLookup {
  return useContext(AvatarContext)
}
