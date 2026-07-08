import { getComposerTarget, type ComposerTarget } from './composerRegistry'
import { getCatchUp } from './intelligenceBridge'

/**
 * What the user was doing at the moment they invoked the command launcher.
 * Captured once at the Cmd/Ctrl+K keystroke (or toolbar click) and passed
 * into the launcher, which FILTERS its actions by it - an action appears
 * only where it can succeed; the context that enables an action is
 * responsible for advertising it.
 */
export interface LauncherContext {
  /** Non-empty text selected inside a compose box (draft text only -
   *  selections on sent messages are deliberately not a context). */
  selection?: { text: string }
  /** The composer a launcher insert/attach would land in (last touched).
   *  Present iff a conversation surface is open. */
  composer?: ComposerTarget
  /** Snapshot of the open thread's catch-me-up availability. */
  catchUp?: { convId: string; newCount: number }
}

export function captureLauncherContext(): LauncherContext {
  const catchUp = getCatchUp()
  return {
    selection: captureComposerSelection(),
    composer: getComposerTarget() ?? undefined,
    catchUp: catchUp ? { convId: catchUp.convId, newCount: catchUp.newCount } : undefined,
  }
}

/** The current text selection, but only when it lives inside a compose box
 *  (tagged with data-composer-editor). */
export function captureComposerSelection(): { text: string } | undefined {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed) return undefined
  const text = sel.toString().trim()
  if (!text) return undefined
  const anchor = sel.anchorNode
  const el = anchor instanceof Element ? anchor : anchor?.parentElement
  if (!el?.closest('[data-composer-editor]')) return undefined
  return { text }
}
