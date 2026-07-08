import { useState } from 'react'
import { createPortal } from 'react-dom'
import { IconX } from '@tabler/icons-react'
import { IconButton } from './ui/IconButton'
import { Button } from './ui/Button'

interface ResolveDialogProps {
  onResolve: (message: string) => void
  onCancel: () => void
}

export function ResolveDialog({ onResolve, onCancel }: ResolveDialogProps) {
  const [message, setMessage] = useState('')

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onCancel} />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="w-[502px] bg-bg-elevated border border-border-subtle rounded-lg shadow-lg pointer-events-auto flex flex-col overflow-hidden">

          {/* Header */}
          <div className="h-12 flex items-center justify-between pl-5 pr-4 border-b border-border-subtle shrink-0">
            <span className="text-h4 text-text-primary">Resolve</span>
            <IconButton tooltip="Close" aria-label="Close" onClick={onCancel}>
              <IconX size={16} stroke={1.5} />
            </IconButton>
          </div>

          {/* Content */}
          <div className="pl-5 pr-4 py-4 flex flex-col gap-2 border-b border-border-subtle">
            <label className="text-input-label text-text-primary">
              Resolution message (optional)
            </label>
            <textarea
              autoFocus
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Summarize the outcome or decision..."
              className="bg-bg-inset border border-border-default focus:border-border-strong rounded-lg px-3 py-2 text-body-2 text-text-primary placeholder:text-text-muted resize-none outline-none h-[109px] leading-[1.4] transition-colors"
            />
          </div>

          {/* Footer */}
          <div className="h-12 flex items-center justify-end gap-2 pl-5 pr-4 shrink-0">
            <Button variant="muted" onClick={onCancel}>Cancel</Button>
            <Button variant="primary" onClick={() => onResolve(message)}>Resolve</Button>
          </div>

        </div>
      </div>
    </>,
    document.body
  )
}
