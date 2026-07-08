import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IconSearch, IconSparkles, IconChevronRight, IconX, IconBlockquote, IconPencil } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { FigmaFindPanel, type FigmaFindPanelHandle } from './FigmaFindPanel'
import { attachFramesToActiveComposer } from '@/lib/composerRegistry'
import type { LauncherContext } from '@/lib/launcherContext'
import type { FigmaFrame } from '@/data/figmaData'
import figmaIcon from '@/assets/figma icon.svg'
import linearIcon from '@/assets/linear icon.svg'
import githubIcon from '@/assets/github icon.svg'
import zendeskIcon from '@/assets/zendesk icon.svg'

type LauncherApp = 'figma' | 'linear' | 'github' | 'zendesk'

/** What an action needs from the invocation context to be able to succeed.
 *  Actions whose requirement isn't met are NOT shown - never a dead click. */
type ActionRequirement = 'selection' | 'draft-or-selection' | 'conversation'

interface AppPreset {
  id: string
  title: string
  /** Presets without behavior are inert in v1 - selecting them just closes. */
  works?: boolean
  /** Context this action needs to succeed. Undefined = works anywhere. */
  requires?: ActionRequirement
}

interface AppMeta {
  app: LauncherApp
  label: string
  icon: string
  description: string
  /** Input placeholder while this app is the active scope. */
  placeholder: string
  presets: AppPreset[]
}

/** Per-app action registry. Deliberately capped (3-5 per app): the drill-in
 *  list must stay scannable in one glance. */
const APPS: AppMeta[] = [
  {
    app: 'figma',
    label: 'Figma',
    icon: figmaIcon,
    description: 'Screens & frames',
    placeholder: "Find a screen, e.g. 'error state in Onboarding v2'...",
    presets: [
      { id: 'figma-find', title: 'Find a screen or frame...', works: true },
      { id: 'figma-attach', title: 'Attach latest frames from a file...' },
      { id: 'figma-link', title: 'Copy link to a frame...' },
    ],
  },
  {
    app: 'linear',
    label: 'Linear',
    icon: linearIcon,
    description: 'Issues & cycles',
    placeholder: "Try 'create issue from this thread' or an issue key...",
    presets: [
      { id: 'linear-create', title: 'Create issue from this thread', requires: 'conversation' },
      { id: 'linear-find', title: 'Find an issue...' },
      { id: 'linear-update', title: 'Update an issue...' },
      { id: 'linear-mine', title: 'My open issues' },
    ],
  },
  {
    app: 'github',
    label: 'GitHub',
    icon: githubIcon,
    description: 'PRs & reviews',
    placeholder: "Try 'find PR' or a PR number...",
    presets: [
      { id: 'github-find', title: 'Find a pull request or issue...' },
      { id: 'github-status', title: 'Check PR status...' },
      { id: 'github-review', title: 'Request a review...' },
    ],
  },
  {
    app: 'zendesk',
    label: 'Zendesk',
    icon: zendeskIcon,
    description: 'Customer tickets',
    placeholder: "Try 'draft a reply on ticket 48821'...",
    presets: [
      { id: 'zendesk-reply', title: 'Draft a reply on a ticket...' },
      { id: 'zendesk-find', title: 'Find a ticket...' },
    ],
  },
]

const PEEK_ACTIONS: AppPreset[] = [
  { id: 'explain', title: 'Explain this', requires: 'selection' },
  { id: 'improve', title: 'Improve writing', requires: 'draft-or-selection' },
  { id: 'spelling', title: 'Check spelling', requires: 'draft-or-selection' },
  { id: 'summarize', title: 'Summarize this conversation', requires: 'conversation' },
]

/** One selectable row: what it renders and what selecting it does. */
interface Row {
  key: string
  render: (isHighlighted: boolean) => React.ReactNode
  onSelect: () => void
}

interface CommandLauncherProps {
  /** Captured at the invoking keystroke/click - see lib/launcherContext. */
  context: LauncherContext
  /** Pre-typed intent (e.g. from a selection-toolbar button). */
  initialQuery?: string
  onClose: () => void
}

/**
 * The global command launcher (Cmd/Ctrl+K anywhere, or click the top-bar
 * search field). Three levels, one input:
 *  - global: search-default row + Intelligence actions + drillable app rows
 *  - app scope: a chip in the input; the app's presets + a live "Ask <app>" row
 *  - figma find mode: frame candidates with thumbnails -> insert into the
 *    last-touched compose box as a file chip
 * Backspace on an empty input pops one level. Esc always closes. Not a chat:
 * one input, one result set, no history.
 *
 * Actions are FILTERED by the invocation context, never just reordered: an
 * action appears only where it can succeed (selection -> Explain; a draft ->
 * Improve writing; an open conversation -> Summarize). The context chip in
 * the input shows what the launcher is acting on; clearing it widens the
 * list back to the globally-capable set.
 */
export function CommandLauncher({ context, initialQuery, onClose }: CommandLauncherProps) {
  const [scope, setScope] = useState<AppMeta | null>(null)
  const [mode, setMode] = useState<'figma-find' | null>(null)
  const [query, setQuery] = useState(initialQuery ?? '')
  const [highlight, setHighlight] = useState(0)
  const [contextCleared, setContextCleared] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const findPanelRef = useRef<FigmaFindPanelHandle>(null)

  const q = query.trim().toLowerCase()

  // The effective context: the X on the context chip widens the launcher back
  // to the globally-capable action set without re-invoking it.
  const ctx: LauncherContext = contextCleared ? {} : context

  const meets = (req?: ActionRequirement): boolean => {
    if (!req) return true
    switch (req) {
      case 'selection':
        return !!ctx.selection
      case 'draft-or-selection':
        return !!ctx.selection || !!ctx.composer?.hasDraft
      case 'conversation':
        return !!ctx.composer
    }
  }

  /** Among capable actions, context still adapts the wording. */
  const intelligenceSubtitle = (p: AppPreset): string => {
    if (p.requires === 'selection') return 'On your selection'
    if (p.requires === 'draft-or-selection') return ctx.selection ? 'On your selection' : 'On your draft'
    return 'Peek Intelligence'
  }

  const enterScope = (app: AppMeta) => {
    setScope(app)
    setMode(null)
    setQuery('')
  }
  const enterFigmaFind = (initialQuery = '') => {
    setMode('figma-find')
    setQuery(initialQuery)
  }
  const popLevel = () => {
    if (mode) setMode(null)
    else if (scope) setScope(null)
    setQuery('')
  }

  const attachFrames = (frames: FigmaFrame[]) => {
    attachFramesToActiveComposer(frames.map((f) => f.id))
    onClose()
  }

  const enterHint = (
    <span className="text-caption text-text-secondary whitespace-nowrap shrink-0">↩ Enter</span>
  )

  const iconTile = (content: React.ReactNode) => (
    <div className="flex items-center justify-center size-8 rounded-sm bg-bg-inset shrink-0">{content}</div>
  )

  const sectionHeader = (label: string) => (
    <div key={`hdr-${label}`} className="flex items-center h-7 px-3">
      <span className="text-[12px] font-medium leading-none text-text-secondary">{label}</span>
    </div>
  )

  // ── Assemble the rows for the current level ──

  const { rows, headers } = useMemo(() => {
    const rows: Row[] = []
    // headers[i] renders BEFORE row index i
    const headers = new Map<number, React.ReactNode>()

    const simpleRow = (
      key: string,
      icon: React.ReactNode,
      title: React.ReactNode,
      subtitle: string | undefined,
      onSelect: () => void,
      trailing?: React.ReactNode
    ): Row => ({
      key,
      onSelect,
      render: (isHl) => (
        <>
          {iconTile(icon)}
          <div className="flex flex-col flex-1 min-w-0 gap-[2px] justify-center">
            <div className="text-[14px] font-normal leading-[1.4] text-text-primary truncate">{title}</div>
            {subtitle && <div className="text-[12px] leading-[1.2] text-text-secondary truncate">{subtitle}</div>}
          </div>
          {isHl ? enterHint : trailing}
        </>
      ),
    })

    // figma-find mode renders the FigmaFindPanel grid instead of rows.
    if (mode === 'figma-find') return { rows, headers }

    if (scope) {
      const capable = scope.presets.filter((p) => meets(p.requires))
      const presets = q ? capable.filter((p) => p.title.toLowerCase().includes(q)) : capable
      if (presets.length > 0) headers.set(0, sectionHeader(`${scope.label} actions`))
      for (const p of presets) {
        rows.push(
          simpleRow(
            p.id,
            <img src={scope.icon} width={20} height={20} alt={scope.label} className="rounded-[4px]" />,
            p.title,
            scope.label,
            () => {
              if (p.id === 'figma-find') enterFigmaFind()
              else onClose() // inert v1
            }
          )
        )
      }
      // The permanent free-intent fallback: dead-ends become invitations.
      if (q) {
        rows.push(
          simpleRow(
            'ask',
            <IconSparkles size={16} stroke={1.5} className="text-text-secondary" />,
            <>
              Ask {scope.label}: "<span className="font-medium">{query.trim()}</span>"
            </>,
            undefined,
            () => {
              if (scope.app === 'figma') enterFigmaFind(query.trim())
              else onClose() // inert v1
            }
          )
        )
      }
      return { rows, headers }
    }

    // ── Global level ──
    if (q) {
      rows.push(
        simpleRow(
          'search',
          <IconSearch size={16} stroke={1.5} className="text-text-secondary" />,
          <>
            Search Peek for "<span className="font-medium">{query.trim()}</span>"
          </>,
          undefined,
          () => onClose() // inert v1
        )
      )
    }

    const capableActions = PEEK_ACTIONS.filter((p) => meets(p.requires))
    const peekActions = q ? capableActions.filter((p) => p.title.toLowerCase().includes(q)) : capableActions
    if (peekActions.length > 0) headers.set(rows.length, sectionHeader('Intelligence'))
    for (const p of peekActions) {
      rows.push(
        simpleRow(
          p.id,
          <IconSparkles size={16} stroke={1.5} className="text-text-secondary" />,
          p.title,
          intelligenceSubtitle(p),
          () => onClose() // inert v1
        )
      )
    }

    const apps = q
      ? APPS.filter((a) => a.label.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
      : APPS
    if (apps.length > 0) headers.set(rows.length, sectionHeader('Apps'))
    for (const a of apps) {
      rows.push(
        simpleRow(
          a.app,
          <img src={a.icon} width={20} height={20} alt={a.label} className="rounded-[4px]" />,
          a.label,
          `${a.description} · ${a.presets.length} actions`,
          () => enterScope(a),
          <IconChevronRight size={16} stroke={1.5} className="text-text-secondary shrink-0" />
        )
      )
    }
    return { rows, headers }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, query, scope, mode, contextCleared])

  // Reset the highlight on every level/query change - except the very first
  // render with a pre-typed intent, where the intended Intelligence action
  // (not the search-default row) should be the one Enter runs.
  const didInitHighlight = useRef(false)
  useEffect(() => {
    if (!didInitHighlight.current) {
      didInitHighlight.current = true
      if (initialQuery) {
        const idx = rows.findIndex((r) => PEEK_ACTIONS.some((p) => p.id === r.key))
        if (idx > 0) {
          setHighlight(idx)
          return
        }
      }
      return
    }
    setHighlight(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, scope, mode])

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-highlighted="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlight])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Find mode: offer the event to the panel first (it owns grid navigation,
    // selection, preview, and attach). Unhandled keys fall through.
    if (mode === 'figma-find' && findPanelRef.current?.onKeyDown(e)) return
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key === 'Backspace' && query === '' && (scope || mode)) {
      e.preventDefault()
      popLevel()
      return
    }
    if (mode === 'figma-find') return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, Math.max(0, rows.length - 1)))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
      return
    }
    // Tab or ArrowRight on an app row scopes into it (drill-in)
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && !scope && !mode) {
      const row = rows[highlight]
      const app = APPS.find((a) => a.app === row?.key)
      if (app) {
        e.preventDefault()
        enterScope(app)
        return
      }
      if (e.key === 'Tab') e.preventDefault()
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      rows[highlight]?.onSelect()
    }
  }

  const placeholder = mode === 'figma-find'
    ? "Search screens and frames..."
    : scope
      ? scope.placeholder
      : 'Search Peek or choose an action...'

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Launcher - anchored high like a launcher, not centered like a dialog */}
      <div className="fixed inset-x-0 top-[18%] z-50 flex justify-center pointer-events-none">
        <div
          className="w-[658px] bg-bg-elevated border border-border-default rounded-lg shadow-lg pointer-events-auto flex flex-col overflow-hidden"
          onKeyDown={handleKeyDown}
        >
          {/* Input row */}
          <div className="flex items-center gap-3 h-12 px-4 border-b border-border-subtle shrink-0">
            <IconSearch size={16} stroke={1.5} className="text-text-secondary shrink-0" />

            {/* Scope chip - the state made visible. Click the X (or Backspace on
                an empty input) to pop back out. */}
            {scope && (
              <div className="inline-flex items-center gap-1.5 bg-bg-inset border border-border-default rounded-full pl-1 pr-1 py-0.5 max-h-[24px] shrink-0">
                <img src={scope.icon} width={16} height={16} alt={scope.label} className="rounded-[3px]" />
                <span className="text-[12px] leading-[1.2] font-medium text-text-primary whitespace-nowrap">
                  {scope.label}
                  {mode === 'figma-find' && <span className="text-text-secondary"> · Find</span>}
                </span>
                <button
                  type="button"
                  onClick={popLevel}
                  className="size-4 flex items-center justify-center rounded-full hover:bg-bg-hover text-text-secondary"
                  aria-label={`Leave ${scope.label}`}
                >
                  <IconX size={10} stroke={1.5} />
                </button>
              </div>
            )}

            {/* Context chip - what the launcher is acting on (selection >
                composer target). X widens back to the globally-capable set.
                Hidden in find mode where the footer names the target. */}
            {mode !== 'figma-find' && !contextCleared && (ctx.selection || ctx.composer) && (
              <div className="inline-flex items-center gap-1.5 bg-bg-inset border border-border-default rounded-full pl-1.5 pr-1 py-0.5 max-h-[24px] max-w-[220px] shrink-0">
                {ctx.selection ? (
                  <IconBlockquote size={12} stroke={1.5} className="text-text-secondary shrink-0" />
                ) : (
                  <IconPencil size={12} stroke={1.5} className="text-text-secondary shrink-0" />
                )}
                <span className="text-[12px] leading-[1.2] font-medium text-text-primary truncate">
                  {ctx.selection
                    ? `"${ctx.selection.text.length > 24 ? ctx.selection.text.slice(0, 24).trimEnd() + '...' : ctx.selection.text}"`
                    : ctx.composer?.label ?? 'Compose box'}
                </span>
                <button
                  type="button"
                  onClick={() => setContextCleared(true)}
                  className="size-4 flex items-center justify-center rounded-full hover:bg-bg-hover text-text-secondary shrink-0"
                  aria-label="Clear context"
                >
                  <IconX size={10} stroke={1.5} />
                </button>
              </div>
            )}

            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 min-w-0 bg-transparent text-input-value text-text-primary placeholder:text-text-muted outline-none"
            />
            <div className="flex items-center justify-center px-1 py-px rounded-sm bg-bg-inset border border-border-strong shrink-0">
              <span className="text-caption text-text-secondary whitespace-nowrap">esc</span>
            </div>
          </div>

          {/* Body: frame picker grid in find mode, rows otherwise */}
          {mode === 'figma-find' ? (
            <FigmaFindPanel
              ref={findPanelRef}
              query={query}
              onAttach={attachFrames}
              attachTarget={context.composer ? { label: context.composer.label } : null}
            />
          ) : (
          <div ref={listRef} className="max-h-[400px] overflow-y-auto p-1">
            {rows.map((row, i) => (
              <div key={row.key}>
                {headers.get(i)}
                <div
                  data-highlighted={highlight === i}
                  className={cn(
                    'flex items-center gap-3 h-12 px-3 cursor-pointer transition-colors rounded-lg',
                    highlight === i && 'bg-bg-hover'
                  )}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    row.onSelect()
                  }}
                >
                  {row.render(highlight === i)}
                </div>
              </div>
            ))}
            {rows.length === 0 && headers.get(0)}
            {rows.length === 0 && !headers.get(0) && (
              <div className="flex items-center h-12 px-3">
                <span className="text-[14px] text-text-secondary">Nothing for that here.</span>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
