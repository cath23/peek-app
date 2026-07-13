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

export interface DebugState {
  desk: DeskDebug
  unreads: UnreadsDebug
  huddles: HuddlesDebug
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
  // Unread is real now (readState, §4.3) — on by default; the toggles remain
  // so the demo can be shown without dots.
  unreads: {
    topics: true,
    people: true,
  },
  huddles: {
    variant: 3,
  },
}

interface DebugContextValue {
  state: DebugState
  setDesk: <K extends keyof DeskDebug>(key: K, value: DeskDebug[K]) => void
  setUnreads: <K extends keyof UnreadsDebug>(key: K, value: UnreadsDebug[K]) => void
  setHuddles: <K extends keyof HuddlesDebug>(key: K, value: HuddlesDebug[K]) => void
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

  return (
    <DebugContext.Provider value={{ state, setDesk, setUnreads, setHuddles }}>
      {children}
    </DebugContext.Provider>
  )
}

export function useDebug() {
  const ctx = useContext(DebugContext)
  if (!ctx) throw new Error('useDebug must be used inside DebugProvider')
  return ctx
}
