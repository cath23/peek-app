import { createPortal } from 'react-dom'
import { type ReactNode } from 'react'
import { IconX } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { IconButton } from './IconButton'

interface DialogShellProps {
  /** Header title. */
  title: string
  /** Called on backdrop click, the close button, and (by convention) Escape. */
  onClose: () => void
  /** Footer content — typically Cancel + a primary Button, right-aligned. */
  footer: ReactNode
  /** The dialog body. Wrap fields in `Field`; the body owns its own gap. */
  children: ReactNode
  /** Extra classes on the scrollable body (e.g. `flex flex-col gap-6 overflow-y-auto`). */
  bodyClassName?: string
  /** Card width in px. Defaults to 502 (the app's standard dialog width). */
  width?: number
}

/**
 * The reusable dialog scaffold: portal + backdrop + centered card with a
 * fixed header (title + close) and footer, and a body slot in between.
 * Every Peek dialog is built from this — a new one is just
 * `<DialogShell title footer>{body}</DialogShell>`.
 */
export function DialogShell({ title, onClose, footer, children, bodyClassName, width = 502 }: DialogShellProps) {
  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="bg-bg-elevated border border-border-subtle rounded-lg shadow-lg pointer-events-auto flex flex-col overflow-hidden"
          style={{ width }}
        >
          {/* Header */}
          <div className="h-12 flex items-center justify-between pl-5 pr-4 border-b border-border-subtle shrink-0">
            <span className="text-h4 text-text-primary">{title}</span>
            <IconButton tooltip="Close" aria-label="Close" onClick={onClose}>
              <IconX size={16} stroke={1.5} />
            </IconButton>
          </div>

          {/* Body */}
          <div className={cn('pl-5 pr-4 py-4 border-b border-border-subtle', bodyClassName)}>
            {children}
          </div>

          {/* Footer */}
          <div className="h-12 flex items-center justify-end gap-2 pl-5 pr-4 shrink-0">
            {footer}
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
