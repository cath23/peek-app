import type { Editor } from '@tiptap/react'

/**
 * Transient plumbing for the EXPERIMENTAL Intelligence features. Everything
 * here is module-level so non-React code (Tiptap suggestion plugins) can
 * participate. Deleting this file plus its call sites removes the wiring.
 */

// ── Master flag, mirrored from the debug context ──
// Suggestion plugins can't call useDebug, so AppShell syncs the value here.

let enabled = true

export function setIntelligenceEnabled(v: boolean) {
  enabled = v
}

export function isIntelligenceEnabled(): boolean {
  return enabled
}

// ── @App queries (mention menu -> AppShell -> launcher) ──

export type AppQueryApp = 'figma' | 'linear'

export interface AppQueryRequest {
  app: AppQueryApp
  /** The composer the @token was typed in. */
  editor: Editor
  /** Where the consumed @token sat - a single picked result inserts its chip here. */
  insertPos: number
}

let appQueryListener: ((req: AppQueryRequest) => void) | null = null

export function onAppQuery(listener: ((req: AppQueryRequest) => void) | null) {
  appQueryListener = listener
}

export function requestAppQuery(req: AppQueryRequest) {
  appQueryListener?.(req)
}

// ── Composer assists (launcher Intelligence rows -> ComposerAssist preview) ──

export type AssistKind = 'fix' | 'tighten' | 'facts'

let assistListener: ((kind: AssistKind) => void) | null = null

export function onAssistRequest(listener: ((kind: AssistKind) => void) | null) {
  assistListener = listener
}

export function requestAssist(kind: AssistKind) {
  assistListener?.(kind)
}

// ── Catch me up (thread panel registers; the launcher offers it) ──

export interface CatchUpHandle {
  convId: string
  newCount: number
  /** Switch the open thread panel into the checkpoint view. */
  activate: () => void
}

let catchUp: CatchUpHandle | null = null

export function registerCatchUp(handle: CatchUpHandle | null) {
  catchUp = handle
}

export function getCatchUp(): CatchUpHandle | null {
  return catchUp
}
