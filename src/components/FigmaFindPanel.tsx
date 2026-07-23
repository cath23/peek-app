import { useState, useEffect, useMemo, forwardRef, useImperativeHandle, useRef } from 'react'
import { IconCheck, IconArrowsMaximize } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/Button'
import { FrameArt } from './ui/FrameArt'
import { FrameLightbox } from './FrameLightbox'
import { searchFigmaFrames, frameBreadcrumb, type FigmaFrame } from '@/api'

const COLS = 3

export interface FigmaFindPanelHandle {
  /** Offer a key event from the launcher input. Returns true when handled. */
  onKeyDown: (e: React.KeyboardEvent) => boolean
}

interface FigmaFindPanelProps {
  query: string
  onAttach: (frames: FigmaFrame[]) => void
  /** The composer an attach would land in. null = no composer anywhere, so
   *  the flow ends in Preview / Copy link instead of a dead Attach click. */
  attachTarget?: { label?: string } | null
}

/**
 * The launcher's Figma frame picker: a thumbnail grid with File › Page
 * breadcrumbs, multi-select (Space / click), full-screen preview (hover
 * expand icon or Shift+Enter), and Enter to attach the selection.
 *
 * The footer adapts its verb to the target: with a composer available it
 * names where frames will land ("Attach to: Reply to Alice"); without one,
 * Enter previews and the primary actions become Preview / Copy link.
 */
export const FigmaFindPanel = forwardRef<FigmaFindPanelHandle, FigmaFindPanelProps>(
  function FigmaFindPanel({ query, onAttach, attachTarget = null }, ref) {
    const [highlight, setHighlight] = useState(0)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [previewFrame, setPreviewFrame] = useState<FigmaFrame | null>(null)
    const [copied, setCopied] = useState(false)
    const gridRef = useRef<HTMLDivElement>(null)

    const frames = useMemo(() => searchFigmaFrames(query), [query])

    useEffect(() => {
      setHighlight(0)
    }, [query])

    useEffect(() => {
      const el = gridRef.current?.querySelector('[data-highlighted="true"]')
      el?.scrollIntoView({ block: 'nearest' })
    }, [highlight])

    const toggleSelect = (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    }

    /** The frames an action applies to: the selection, or the highlighted one. */
    const chosenFrames = () =>
      selectedIds.size > 0
        ? frames.filter((f) => selectedIds.has(f.id))
        : frames[highlight]
          ? [frames[highlight]]
          : []

    const attachCurrent = () => {
      const chosen = chosenFrames()
      if (chosen.length > 0) onAttach(chosen)
    }

    const previewCurrent = () => {
      const frame = frames[highlight] ?? chosenFrames()[0]
      if (frame) setPreviewFrame(frame)
    }

    const copyLinks = (framesToCopy: FigmaFrame[]) => {
      if (framesToCopy.length === 0) return
      const links = framesToCopy.map(
        (f) => `https://figma.com/design/peek/${encodeURIComponent(f.file)}?node-id=${f.id}`
      )
      void navigator.clipboard?.writeText(links.join('\n'))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    }

    useImperativeHandle(ref, () => ({
      onKeyDown: (e: React.KeyboardEvent): boolean => {
        if (previewFrame) {
          if (e.key === 'Escape') {
            e.preventDefault()
            setPreviewFrame(null)
            return true
          }
          if (e.key === 'Enter') {
            e.preventDefault()
            if (attachTarget) onAttach([previewFrame])
            else copyLinks([previewFrame])
            return true
          }
          return true // swallow everything else while previewing
        }
        if (e.key === 'ArrowRight') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, frames.length - 1)); return true }
        if (e.key === 'ArrowLeft') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); return true }
        if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + COLS, frames.length - 1)); return true }
        if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - COLS, 0)); return true }
        if (e.key === ' ' && query === '') {
          // Space toggles selection - but only intercepted when the input is
          // empty, so typing multi-word queries still works naturally.
          e.preventDefault()
          if (frames[highlight]) toggleSelect(frames[highlight].id)
          return true
        }
        if (e.key === 'Enter' && e.shiftKey) {
          e.preventDefault()
          if (frames[highlight]) setPreviewFrame(frames[highlight])
          return true
        }
        if (e.key === 'Enter') {
          e.preventDefault()
          if (attachTarget) attachCurrent()
          else previewCurrent()
          return true
        }
        return false
      },
    }))

    const selectedCount = selectedIds.size

    return (
      <>
        <div ref={gridRef} className="max-h-[400px] overflow-y-auto p-2">
          {frames.length === 0 ? (
            <div className="flex items-center h-12 px-3">
              <span className="text-[14px] text-text-secondary">No frames match "{query.trim()}".</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {frames.map((frame, i) => {
                const isHl = highlight === i
                const isSelected = selectedIds.has(frame.id)
                return (
                  <div
                    key={frame.id}
                    data-highlighted={isHl}
                    className={cn(
                      'group relative flex flex-col rounded-lg border p-2 gap-2 cursor-pointer transition-colors',
                      isSelected
                        ? 'border-accent-primary bg-accent-muted/30'
                        : isHl
                          ? 'border-border-default bg-bg-hover'
                          : 'border-border-subtle'
                    )}
                    onMouseEnter={() => setHighlight(i)}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      toggleSelect(frame.id)
                    }}
                  >
                    {/* Thumbnail area */}
                    <div className="h-28 rounded-md bg-bg-inset flex items-center justify-center overflow-hidden">
                      <FrameArt frame={frame} className={frame.kind === 'mobile' ? 'h-24' : 'w-[85%]'} />
                    </div>

                    {/* Name + breadcrumb */}
                    <div className="flex flex-col gap-[2px] min-w-0">
                      <span className="text-[13px] font-medium leading-[1.3] text-text-primary truncate">{frame.name}</span>
                      <span className="text-[11px] leading-[1.2] text-text-secondary truncate">{frameBreadcrumb(frame)}</span>
                    </div>

                    {/* Selection check */}
                    <div
                      className={cn(
                        'absolute top-3 right-3 size-5 rounded-full border flex items-center justify-center transition-colors',
                        isSelected
                          ? 'bg-accent-primary border-accent-primary'
                          : 'bg-bg-elevated/80 border-border-strong opacity-0 group-hover:opacity-100'
                      )}
                    >
                      {isSelected && <IconCheck size={12} stroke={2.5} className="text-accent-muted signal:text-[color:var(--text-inverse)]" />}
                    </div>

                    {/* Expand-to-preview */}
                    <button
                      type="button"
                      aria-label={`Preview ${frame.name}`}
                      className="absolute top-3 left-3 size-5 rounded-full bg-bg-elevated/80 border border-border-strong items-center justify-center text-text-secondary hover:text-text-primary opacity-0 group-hover:opacity-100 hidden group-hover:flex"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setPreviewFrame(frame)
                      }}
                    >
                      <IconArrowsMaximize size={11} stroke={1.75} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer - the verb adapts to the target */}
        <div className="h-11 flex items-center justify-between gap-3 pl-4 pr-2 border-t border-border-subtle shrink-0">
          <span className="text-caption text-text-secondary truncate">
            {copied
              ? 'Link copied'
              : attachTarget
                ? selectedCount > 0
                  ? `${selectedCount} selected · Attach to: ${attachTarget.label ?? 'compose box'}`
                  : `Attach to: ${attachTarget.label ?? 'compose box'} · Space to select`
                : selectedCount > 0
                  ? `${selectedCount} selected`
                  : 'Click or Space to select · ↵ to preview'}
          </span>
          {attachTarget ? (
            <Button
              variant="primary"
              size="small"
              disabled={frames.length === 0}
              onClick={attachCurrent}
            >
              {selectedCount > 1 ? `Attach ${selectedCount} frames` : 'Attach'}
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outlined"
                size="small"
                disabled={frames.length === 0}
                onClick={() => copyLinks(chosenFrames())}
              >
                {selectedCount > 1 ? `Copy ${selectedCount} links` : 'Copy link'}
              </Button>
              <Button
                variant="primary"
                size="small"
                disabled={frames.length === 0}
                onClick={previewCurrent}
              >
                Preview
              </Button>
            </div>
          )}
        </div>

        {previewFrame && (
          <FrameLightbox
            frame={previewFrame}
            onClose={() => setPreviewFrame(null)}
            actionLabel={attachTarget ? 'Attach' : copied ? 'Link copied' : 'Copy link'}
            onAction={() => {
              if (attachTarget) onAttach([previewFrame])
              else copyLinks([previewFrame])
            }}
          />
        )}
      </>
    )
  }
)
