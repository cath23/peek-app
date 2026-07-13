import { PEOPLE } from '@/data/peopleData'
import { TOPICS } from '@/data/topicData'
import { APP_FILES, DOCUMENT_FILES } from '@/data/filesData'

// ── Mention regex ──
//
// Matches: @FullName / !@FullName (PEOPLE), @lowercase-handle (teams/groups
// like @backend-team, @devops), and [Topic Title] / [File Title] brackets.
// The lookahead (?![a-zA-Z/-]) prevents partial matches inside camelCase or
// package paths (e.g. @testing-library/react is left as plain text). The `-`
// in the carve-out is critical: without it, regex backtracking would let
// `@testing` match because the next char is `-` (a handle continuation char).
//
// Names are sorted longest-first so partial-overlap candidates ("Bob" vs
// "Bob Smith") don't shadow the longer match.

// Whose names render as mention chips. Defaults to the mock cast; the seam
// swaps in the real workspace directory at runtime (src/api/mentions.tsx) so a
// real teammate's @mention renders as a chip too, not as plain text.
let _mentionNames: string[] = PEOPLE.map((p) => p.name)

const _escapedNames = () =>
  _mentionNames
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length)
    .join('|')

const _escapedBracketTitles = [
  ...TOPICS.map((t) => t.title),
  ...APP_FILES.map((f) => f.title),
  ...DOCUMENT_FILES.map((f) => f.title),
]
  .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .sort((a, b) => b.length - a.length)
  .join('|')

function _buildMentionRe(): RegExp {
  return new RegExp(
    `((?:!@|@)(?:${_escapedNames()})|@[a-z][a-z0-9-]+(?![a-zA-Z/-])|\\[(?:${_escapedBracketTitles})\\])`,
    'g'
  )
}

/** `g`-flagged — use matchAll/split, never rely on lastIndex across calls. */
export let MENTION_RE = _buildMentionRe()

/** The seam calls this when the workspace directory changes. Rebuilds BOTH
 *  regexes — INLINE_TOKEN_RE is the one read-only bodies actually render with,
 *  so forgetting it would leave real teammates' mentions as plain text. */
export function setMentionNames(names: string[]) {
  _mentionNames = names.length ? names : PEOPLE.map((p) => p.name)
  MENTION_RE = _buildMentionRe()
  INLINE_TOKEN_RE = _buildInlineTokenRe()
}

// ── External references (auto-linked) ──
//
// Text patterns that clearly point at something in a connected app become
// clickable reference chips in read-only message bodies (same pill treatment
// as [file] mentions, plus a pointer cursor + hover underline).
//
// Order matters: the worded forms ("Zendesk ticket #48821", "PR #482",
// "Build #4821") must come before the bare `#123` fallback so the context
// word is captured as part of the chip label.

const _referenceAlternation = [
  '(?:Zendesk )?[Tt]icket #\\d+',
  'PR #\\d+',
  '[Bb]uild #\\d+',
  'PEEK-\\d+',
  '#\\d+(?!\\d)',
].join('|')

/** Tokenizer for read-only rendering: mentions, [refs], and external references.
 *  Single capture group so String.split() interleaves cleanly.
 *  Rebuilt alongside MENTION_RE when the workspace directory changes. */
function _buildInlineTokenRe(): RegExp {
  return new RegExp(
    `((?:!@|@)(?:${_escapedNames()})|@[a-z][a-z0-9-]+(?![a-zA-Z/-])|\\[(?:${_escapedBracketTitles})\\]|${_referenceAlternation})`,
    'g'
  )
}

export let INLINE_TOKEN_RE = _buildInlineTokenRe()

export type ReferenceKind = 'linear' | 'github' | 'build' | 'ticket'

export interface ReferenceMatch {
  kind: ReferenceKind
  href: string
}

/** Classify a token produced by INLINE_TOKEN_RE as an external reference.
 *  Returns null for mentions/brackets/plain text. Hrefs are plausible
 *  destinations in the connected apps (prototype: links are inert). */
export function matchReference(part: string): ReferenceMatch | null {
  const num = part.match(/\d+/)?.[0]
  if (/^PEEK-\d+$/.test(part)) {
    return { kind: 'linear', href: `https://linear.app/peek/issue/${part}` }
  }
  if (/^(?:Zendesk )?[Tt]icket #\d+$/.test(part)) {
    return { kind: 'ticket', href: `https://peek.zendesk.com/agent/tickets/${num}` }
  }
  if (/^[Bb]uild #\d+$/.test(part)) {
    return { kind: 'build', href: `https://github.com/peek/peek/actions/runs/${num}` }
  }
  if (/^(?:PR )?#\d+$/.test(part)) {
    return { kind: 'github', href: `https://github.com/peek/peek/pull/${num}` }
  }
  return null
}

// ── Inline content parser ──

/** Parse a single line into Tiptap inline JSON nodes (text + mention nodes). */
export function parseInlineContent(line: string): Record<string, unknown>[] {
  const parts = line.split(MENTION_RE)
  const content: Record<string, unknown>[] = []
  for (const part of parts) {
    if (!part) continue
    if (part.startsWith('!@') && part.length > 2) {
      const name = part.slice(2)
      const person = PEOPLE.find((p) => p.name === name)
      content.push({ type: 'urgentMention', attrs: { id: person?.id ?? name, label: name } })
    } else if (part.startsWith('@') && part.length > 1) {
      const name = part.slice(1)
      const person = PEOPLE.find((p) => p.name === name)
      content.push({ type: 'mention', attrs: { id: person?.id ?? name, label: name } })
    } else if (part.startsWith('[') && part.endsWith(']') && part.length > 2) {
      const title = part.slice(1, -1)
      const topic = TOPICS.find((t) => t.title === title)
      if (topic) {
        content.push({
          type: 'topicMention',
          attrs: {
            id: topic.id,
            label: title,
            isResolved: topic.isResolved,
          },
        })
      } else {
        const appFile = APP_FILES.find((f) => f.title === title)
        const docFile = DOCUMENT_FILES.find((f) => f.title === title)
        const file = appFile ?? docFile
        content.push({
          type: 'fileMention',
          attrs: {
            id: file?.id ?? title,
            label: title,
            app: appFile?.app ?? docFile?.docType ?? '',
            subtitle: file?.subtitle ?? '',
          },
        })
      }
    } else {
      content.push({ type: 'text', text: part })
    }
  }
  return content
}

// ── Tiptap → text serializer ──
//
// The Tiptap node shape isn't directly importable for our purposes; we use a
// minimal structural type matching only the methods/fields we touch.

interface TiptapInlineChild {
  type: { name: string }
  attrs: Record<string, string>
  text?: string
}

interface TiptapNode {
  forEach: (cb: (child: TiptapInlineChild) => void) => void
}

/** Serialize a Tiptap inline node (paragraph or list-item paragraph) back to text. */
export function serializeInline(node: TiptapNode): string {
  let text = ''
  node.forEach((child) => {
    if (child.type.name === 'highlightTag') { /* skip */ }
    else if (child.type.name === 'hardBreak') {
      text += '\n'
    } else if (child.type.name === 'mention') {
      text += `@${child.attrs.label}`
    } else if (child.type.name === 'urgentMention') {
      text += `!@${child.attrs.label}`
    } else if (child.type.name === 'topicMention') {
      text += `[${child.attrs.label}] `
    } else if (child.type.name === 'fileMention') {
      text += `[${child.attrs.label}] `
    } else {
      text += child.text ?? ''
    }
  })
  return text
}

// ── Body segments (for read-only rendering of plain-text bodies) ──

export type BodySegment =
  | { type: 'text'; lines: string[] }
  | { type: 'bullet'; items: string[] }
  | { type: 'numbered'; items: string[] }

/** Split a multi-line body string into a list of segments (text / bullet / numbered).
 *  Blank lines split runs of plain text into separate `text` segments. */
export function parseBodySegments(body: string): BodySegment[] {
  const lines = body.split('\n')
  const segments: BodySegment[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^[-•]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-•]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-•]\s/, ''))
        i++
      }
      segments.push({ type: 'bullet', items })
    } else if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      segments.push({ type: 'numbered', items })
    } else {
      const textLines: string[] = []
      while (i < lines.length && !/^[-•]\s/.test(lines[i]) && !/^\d+\.\s/.test(lines[i])) {
        textLines.push(lines[i])
        i++
      }
      // Blank lines split a run of text into separate paragraph segments.
      let chunk: string[] = []
      for (const l of textLines) {
        if (l === '') {
          if (chunk.length > 0) { segments.push({ type: 'text', lines: chunk }); chunk = [] }
        } else {
          chunk.push(l)
        }
      }
      if (chunk.length > 0) segments.push({ type: 'text', lines: chunk })
    }
  }
  return segments
}

// ── textToTiptapContent (used by edit-mode editor) ──

/** Convert plain-text body to Tiptap doc content for pre-populating the edit editor. */
export function textToTiptapContent(text: string) {
  const lines = text.split('\n')
  const docContent: Record<string, unknown>[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (/^[-•]\s/.test(line)) {
      const items: Record<string, unknown>[] = []
      while (i < lines.length && /^[-•]\s/.test(lines[i])) {
        const itemText = lines[i].replace(/^[-•]\s/, '')
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: parseInlineContent(itemText) }],
        })
        i++
      }
      docContent.push({ type: 'bulletList', content: items })
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      const items: Record<string, unknown>[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const itemText = lines[i].replace(/^\d+\.\s/, '')
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: parseInlineContent(itemText) }],
        })
        i++
      }
      docContent.push({ type: 'orderedList', content: items })
      continue
    }

    if (line.length === 0) {
      docContent.push({ type: 'paragraph', content: [] })
    } else {
      docContent.push({ type: 'paragraph', content: parseInlineContent(line) })
    }
    i++
  }

  return { type: 'doc' as const, content: docContent }
}

// ── serializeTiptapToText (whole-doc serializer for edit-mode submit) ──
//
// We type the editor structurally with `unknown` for the doc and use a small
// internal cast to keep the `forEach` access — Tiptap's real type involves
// generics that aren't worth importing here.

/** Serialize a full Tiptap editor doc to plain text. Skips resolutionBlock nodes
 *  (those are consumed by the resolve action, not part of the message body). */
export function serializeTiptapToText(editor: { state: { doc: unknown } } | null | undefined): string {
  if (!editor) return ''
  const doc = editor.state.doc as { forEach: (cb: (node: TiptapInlineChild & TiptapNode) => void) => void }
  const lines: string[] = []
  doc.forEach((node) => {
    if (node.type.name === 'resolutionBlock') return
    if (node.type.name === 'paragraph') {
      lines.push(serializeInline(node))
    } else if (node.type.name === 'bulletList') {
      node.forEach((li) => {
        const liNode = li as TiptapInlineChild & TiptapNode
        liNode.forEach((liChild) => {
          if (liChild.type.name === 'paragraph') {
            lines.push(`- ${serializeInline(liChild as TiptapInlineChild & TiptapNode)}`)
          }
        })
      })
    } else if (node.type.name === 'orderedList') {
      let idx = 1
      node.forEach((li) => {
        const liNode = li as TiptapInlineChild & TiptapNode
        liNode.forEach((liChild) => {
          if (liChild.type.name === 'paragraph') {
            lines.push(`${idx}. ${serializeInline(liChild as TiptapInlineChild & TiptapNode)}`)
            idx++
          }
        })
      })
    }
  })
  return lines.join('\n').trim()
}
