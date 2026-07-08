import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { IconAbc, IconWand, IconChecklist, IconCommand } from '@tabler/icons-react'
import { IconButton } from './ui/IconButton'
import { Button } from './ui/Button'
import { getActiveComposer } from '@/lib/composerRegistry'
import { onAssistRequest, type AssistKind } from '@/lib/intelligenceBridge'
import { useLastSelection } from '@/lib/lastSelection'
import {
  applyFix,
  applyTighten,
  checkFacts,
  diffWords,
  type DiffSegment,
  type FactCheckFlag,
} from '@/data/intelligenceData'

interface ComposerAssistProps {
  /** Open the command launcher (the ⌘K button on the toolbar). */
  onLaunch: () => void
}

interface Preview {
  kind: AssistKind
  from: number
  to: number
  result?: string
  segments?: DiffSegment[]
  flags?: FactCheckFlag[]
  /** Honest empty state ("Nothing to fix.") - shown instead of a diff. */
  message?: string
  pos: { top: number; left: number }
}

const ASSIST_TITLES: Record<AssistKind, string> = {
  fix: 'Fix spelling & grammar',
  tighten: 'Tighten writing',
  facts: 'Check facts',
}

/**
 * The write-side Intelligence surface: a small toolbar floating above a text
 * selection INSIDE a compose box (draft text is the context that enables
 * transformation verbs, so the draft is where they appear). Fix and Tighten
 * preview as a word diff and apply in place; Check facts flags claims that
 * contradict the example conversations, with a link to the evidence.
 * Also serves whole-draft assists requested from the launcher's Intelligence
 * rows (via the intelligence bridge).
 */
export function ComposerAssist({ onLaunch }: ComposerAssistProps) {
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const draggingRef = useRef(false)
  const navigate = useNavigate()
  const { setPendingTopicThread } = useLastSelection()

  // ── Selection tracking (composer only) ──

  const evaluate = useCallback(() => {
    if (draggingRef.current) return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0 || !sel.toString().trim()) {
      setToolbarPos(null)
      return
    }
    const anchor = sel.anchorNode
    const el = anchor instanceof Element ? anchor : anchor?.parentElement
    if (!el?.closest('[data-composer-editor]')) {
      setToolbarPos(null)
      return
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) {
      setToolbarPos(null)
      return
    }
    setToolbarPos({
      top: Math.max(rect.top - 8, 44),
      left: Math.min(Math.max(rect.left + rect.width / 2, 90), window.innerWidth - 90),
    })
  }, [])

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.('[data-composer-assist]')) return
      draggingRef.current = true
      setToolbarPos(null)
    }
    const onMouseUp = () => {
      draggingRef.current = false
      window.setTimeout(evaluate, 0)
    }
    const onSelectionChange = () => {
      if (!draggingRef.current) evaluate()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setToolbarPos(null)
        setPreview(null)
      }
    }
    const onScroll = () => setToolbarPos(null)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('selectionchange', onSelectionChange)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('selectionchange', onSelectionChange)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [evaluate])

  // ── Running an assist ──

  const runAssist = useCallback(
    (kind: AssistKind, wholeDraft: boolean) => {
      const handle = getActiveComposer()
      if (!handle) return
      const { editor } = handle
      const sel = editor.state.selection
      const useWhole = wholeDraft || sel.empty
      const from = useWhole ? 0 : sel.from
      const to = useWhole ? editor.state.doc.content.size : sel.to
      const original = editor.state.doc.textBetween(from, to, '\n', ' ').trim()
      if (!original) return

      // Anchor the card: at the selection when there is one, else above the composer.
      let pos: Preview['pos']
      if (!useWhole && toolbarPos) {
        pos = toolbarPos
      } else {
        const rect = editor.view.dom.getBoundingClientRect()
        pos = { top: Math.max(rect.top - 8, 44), left: rect.left + rect.width / 2 }
      }

      if (kind === 'facts') {
        const flags = checkFacts(original)
        setPreview({
          kind,
          from,
          to,
          flags,
          message: flags.length === 0 ? 'No conflicts found with this conversation.' : undefined,
          pos,
        })
        setToolbarPos(null)
        return
      }

      const result = kind === 'fix' ? applyFix(original) : applyTighten(original)
      if (result.trim() === original) {
        setPreview({
          kind,
          from,
          to,
          message: kind === 'fix' ? 'Nothing to fix.' : 'Already tight.',
          pos,
        })
      } else {
        setPreview({ kind, from, to, result, segments: diffWords(original, result), pos })
      }
      setToolbarPos(null)
    },
    [toolbarPos]
  )

  // Launcher Intelligence rows route here (whole-draft assists).
  useEffect(() => {
    onAssistRequest((kind) => runAssist(kind, true))
    return () => onAssistRequest(null)
  }, [runAssist])

  const applyPreview = () => {
    const handle = getActiveComposer()
    if (!handle || !preview?.result) return
    const { editor } = handle
    const wholeDoc = preview.from === 0
    if (wholeDoc) {
      const paragraphs = preview.result.split('\n').map((line) => ({
        type: 'paragraph',
        content: line ? [{ type: 'text', text: line }] : [],
      }))
      editor.chain().focus().setContent({ type: 'doc', content: paragraphs }).run()
    } else {
      editor
        .chain()
        .focus()
        .insertContentAt({ from: preview.from, to: preview.to }, preview.result.replace(/\n/g, ' '))
        .run()
    }
    setPreview(null)
  }

  const viewSource = (flag: FactCheckFlag) => {
    setPreview(null)
    setPendingTopicThread({ topicId: flag.topicId, convId: flag.anchorConvId })
    navigate(`/topics/${flag.topicId}`)
  }

  // ── Render ──

  return createPortal(
    <>
      {toolbarPos && !preview && (
        <div
          data-composer-assist
          className="fixed z-30 -translate-x-1/2 -translate-y-full bg-bg-elevated border border-border-default rounded-lg shadow-lg p-1 flex items-center gap-0.5"
          style={{ top: toolbarPos.top, left: toolbarPos.left }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <IconButton tooltip="Fix spelling & grammar" aria-label="Fix spelling & grammar" onMouseDown={(e) => { e.preventDefault(); runAssist('fix', false) }}>
            <IconAbc size={16} stroke={1.5} />
          </IconButton>
          <IconButton tooltip="Tighten writing" aria-label="Tighten writing" onMouseDown={(e) => { e.preventDefault(); runAssist('tighten', false) }}>
            <IconWand size={16} stroke={1.5} />
          </IconButton>
          <IconButton tooltip="Check facts" aria-label="Check facts" onMouseDown={(e) => { e.preventDefault(); runAssist('facts', false) }}>
            <IconChecklist size={16} stroke={1.5} />
          </IconButton>
          <div className="w-px h-4 bg-border-subtle mx-0.5" />
          <IconButton tooltip="More · ⌘K" aria-label="More Intelligence actions" onMouseDown={(e) => { e.preventDefault(); onLaunch() }}>
            <IconCommand size={16} stroke={1.5} />
          </IconButton>
        </div>
      )}

      {preview && (
        <div
          data-composer-assist
          className="fixed z-30 -translate-x-1/2 -translate-y-full w-[420px] max-w-[calc(100vw-32px)] bg-bg-elevated border border-border-default rounded-lg shadow-lg flex flex-col"
          style={{ top: preview.pos.top, left: preview.pos.left }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center h-9 px-3 border-b border-border-subtle">
            <span className="text-[12px] font-medium leading-none text-text-secondary">
              {ASSIST_TITLES[preview.kind]}
            </span>
          </div>

          <div className="px-3 py-2.5 max-h-[220px] overflow-y-auto">
            {preview.message && (
              <p className="text-sm text-text-secondary leading-[1.4]">{preview.message}</p>
            )}

            {preview.segments && (
              <p className="text-sm leading-[1.5]">
                {preview.segments.map((seg, i) => (
                  <span
                    key={i}
                    className={
                      seg.kind === 'removed'
                        ? 'line-through text-text-muted'
                        : seg.kind === 'added'
                          ? 'text-success-default font-medium'
                          : 'text-text-primary'
                    }
                  >
                    {seg.text}{' '}
                  </span>
                ))}
              </p>
            )}

            {preview.flags && preview.flags.length > 0 && (
              <div className="flex flex-col gap-2.5">
                {preview.flags.map((flag) => (
                  <div key={flag.id} className="flex flex-col gap-1">
                    <p className="text-sm text-text-primary leading-[1.4]">{flag.flag}</p>
                    <button
                      type="button"
                      className="self-start text-[12px] leading-[1.2] text-text-secondary hover:text-text-primary hover:underline cursor-pointer"
                      onClick={() => viewSource(flag)}
                    >
                      {flag.sourceLabel} →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-1.5 px-2 pb-2">
            <Button variant="muted" size="small" onClick={() => setPreview(null)}>
              {preview.result ? 'Cancel' : 'Done'}
            </Button>
            {preview.result && (
              <Button variant="primary" size="small" onClick={applyPreview}>
                Apply
              </Button>
            )}
          </div>
        </div>
      )}
    </>,
    document.body
  )
}
