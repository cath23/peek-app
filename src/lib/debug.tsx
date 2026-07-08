import { createContext, useContext, useState, type ReactNode } from 'react'

interface DeskDebug {
  showScreener: boolean
  screenerItemsCount: 1 | 2
  showUrgent: boolean
  urgentItemsCount: 1 | 2
  openWorkHasData: boolean
  starredHasData: boolean
}

interface UnreadsDebug {
  topics: boolean
  people: boolean
}

export type HuddleVariant = 1 | 2 | 3

interface HuddlesDebug {
  variant: HuddleVariant
}

/** Master switch for the experimental AI features (selection toolbar,
 *  launcher Intelligence actions, @App queries, timeline, catch-me-up).
 *  Off = the app behaves exactly as it did before the Intelligence work. */
interface IntelligenceDebug {
  enabled: boolean
}

export interface DebugState {
  desk: DeskDebug
  unreads: UnreadsDebug
  huddles: HuddlesDebug
  intelligence: IntelligenceDebug
}

const DEFAULT_DEBUG: DebugState = {
  desk: {
    showScreener: true,
    screenerItemsCount: 2,
    showUrgent: true,
    urgentItemsCount: 2,
    openWorkHasData: true,
    starredHasData: true,
  },
  unreads: {
    topics: false,
    people: false,
  },
  huddles: {
    variant: 3,
  },
  intelligence: {
    enabled: true,
  },
}

interface DebugContextValue {
  state: DebugState
  setDesk: <K extends keyof DeskDebug>(key: K, value: DeskDebug[K]) => void
  setUnreads: <K extends keyof UnreadsDebug>(key: K, value: UnreadsDebug[K]) => void
  setHuddles: <K extends keyof HuddlesDebug>(key: K, value: HuddlesDebug[K]) => void
  setIntelligence: <K extends keyof IntelligenceDebug>(key: K, value: IntelligenceDebug[K]) => void
}

const DebugContext = createContext<DebugContextValue | null>(null)

export function DebugProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DebugState>(DEFAULT_DEBUG)

  const setDesk = <K extends keyof DeskDebug>(key: K, value: DeskDebug[K]) => {
    setState((prev) => ({ ...prev, desk: { ...prev.desk, [key]: value } }))
  }

  const setUnreads = <K extends keyof UnreadsDebug>(key: K, value: UnreadsDebug[K]) => {
    setState((prev) => ({ ...prev, unreads: { ...prev.unreads, [key]: value } }))
  }

  const setHuddles = <K extends keyof HuddlesDebug>(key: K, value: HuddlesDebug[K]) => {
    setState((prev) => ({ ...prev, huddles: { ...prev.huddles, [key]: value } }))
  }

  const setIntelligence = <K extends keyof IntelligenceDebug>(key: K, value: IntelligenceDebug[K]) => {
    setState((prev) => ({ ...prev, intelligence: { ...prev.intelligence, [key]: value } }))
  }

  return (
    <DebugContext.Provider value={{ state, setDesk, setUnreads, setHuddles, setIntelligence }}>
      {children}
    </DebugContext.Provider>
  )
}

export function useDebug() {
  const ctx = useContext(DebugContext)
  if (!ctx) throw new Error('useDebug must be used inside DebugProvider')
  return ctx
}
