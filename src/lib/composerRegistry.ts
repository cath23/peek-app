import type { Editor } from '@tiptap/react'

/**
 * Tracks the composer the user most recently focused (or, failing that, the
 * last one mounted) so global surfaces like the command launcher can insert
 * content "into the compose box" without threading refs through the tree.
 */
export interface ComposerHandle {
  editor: Editor
  /** Attach Figma frames (by id) to this composer's attachment strip. */
  attachFrames: (frameIds: string[]) => void
  /** Where a launcher insert/attach lands, e.g. "Reply to Alice", "#Mobile rewrite". */
  label?: string
}

/** A snapshot of the active composer for context-aware surfaces (the command
 *  launcher). Its existence doubles as "a conversation surface is open". */
export interface ComposerTarget {
  label?: string
  isFocused: boolean
  hasDraft: boolean
}

let activeComposer: ComposerHandle | null = null

export function getComposerTarget(): ComposerTarget | null {
  if (!activeComposer || activeComposer.editor.isDestroyed) return null
  return {
    label: activeComposer.label,
    isFocused: activeComposer.editor.isFocused,
    hasDraft: activeComposer.editor.state.doc.textContent.trim().length > 0,
  }
}

export function registerActiveComposer(handle: ComposerHandle) {
  activeComposer = handle
}

export function unregisterComposer(editor: Editor) {
  if (activeComposer?.editor === editor) activeComposer = null
}

export interface FileMentionAttrs {
  id: string
  label: string
  app: string
  subtitle: string
}

/** Insert a file-reference chip (plus a trailing space) at the active
 *  composer's cursor. Returns false when no composer is available. */
export function insertFileMentionIntoActiveComposer(attrs: FileMentionAttrs): boolean {
  if (!activeComposer || activeComposer.editor.isDestroyed) return false
  activeComposer.editor
    .chain()
    .focus()
    .insertContent([
      { type: 'fileMention', attrs },
      { type: 'text', text: ' ' },
    ])
    .run()
  return true
}

/** Attach Figma frames to the active composer's attachment strip (previews
 *  below the text, carried on send). Returns false when no composer exists. */
export function attachFramesToActiveComposer(frameIds: string[]): boolean {
  if (!activeComposer || activeComposer.editor.isDestroyed) return false
  activeComposer.attachFrames(frameIds)
  activeComposer.editor.chain().focus().run()
  return true
}
