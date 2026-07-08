/**
 * Seam-internal runtime stores.
 *
 * `PeekDataProvider` is the single provider the app (and story decorators)
 * mount; it composes the runtime override stores that Phase 2 deletes
 * entity-by-entity as Convex takes over:
 *   - StarredProvider        (stars)
 *   - TopicStoreProvider     (runtime topics + DM-promoted huddles)
 *   - TopicMutationsProvider (the message/reply/huddle override layers)
 *   - DmRuntimeProvider      (DM sent messages — lifted here from
 *     useDmConversationView's hook-local state so DM sends survive
 *     navigation, matching topic behavior and the future backend)
 *
 * Nothing outside src/api may import the underlying providers directly.
 */
import { createContext, useContext, useState, useMemo, type ReactNode, type Dispatch, type SetStateAction } from 'react'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { StarredProvider } from '@/api/internal/starred'
import { TopicStoreProvider } from '@/api/internal/topicStore'
import { TopicMutationsProvider } from '@/api/internal/topicMutations'
import type { ConversationData } from './types'

// Convex client — present only when a deployment is configured
// (`npx convex dev` writes VITE_CONVEX_URL to .env.local). Absent in unit
// tests and in checkouts without a deployment, where the mock-backed
// internals below serve everything, so the app keeps working either way
// during the Phase 2 entity-by-entity swap.
const CONVEX_URL =
  import.meta.env.MODE === 'test' ? undefined : (import.meta.env.VITE_CONVEX_URL as string | undefined)
// The client always exists so seam hooks can call useQuery/useMutation
// unconditionally (rules of hooks); without a deployment every query passes
// 'skip' (gated on hasConvex), so the placeholder client never connects.
const convexClient = new ConvexReactClient(CONVEX_URL ?? 'https://peek-no-deployment.convex.cloud')

interface DmRuntimeValue {
  /** Runtime-sent DM messages, keyed by dmId. */
  sentDmMessages: Record<number, ConversationData[]>
  setSentDmMessages: Dispatch<SetStateAction<Record<number, ConversationData[]>>>
}

const DmRuntimeContext = createContext<DmRuntimeValue | null>(null)

function DmRuntimeProvider({ children }: { children: ReactNode }) {
  const [sentDmMessages, setSentDmMessages] = useState<Record<number, ConversationData[]>>({})
  const value = useMemo(() => ({ sentDmMessages, setSentDmMessages }), [sentDmMessages])
  return <DmRuntimeContext.Provider value={value}>{children}</DmRuntimeContext.Provider>
}

/** Seam-internal. Components never call this. */
export function useDmRuntime(): DmRuntimeValue {
  const ctx = useContext(DmRuntimeContext)
  if (!ctx) throw new Error('useDmRuntime must be used within PeekDataProvider')
  return ctx
}

export function PeekDataProvider({ children }: { children: ReactNode }) {
  const tree = (
    <StarredProvider>
      <TopicStoreProvider>
        <TopicMutationsProvider>
          <DmRuntimeProvider>{children}</DmRuntimeProvider>
        </TopicMutationsProvider>
      </TopicStoreProvider>
    </StarredProvider>
  )
  return <ConvexProvider client={convexClient}>{tree}</ConvexProvider>
}

/** Whether a Convex deployment is wired up (drives seam-internal fallbacks). */
export const hasConvex = CONVEX_URL !== undefined
