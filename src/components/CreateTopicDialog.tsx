import { useState } from 'react'
import { createPortal } from 'react-dom'
import { IconX, IconLock } from '@tabler/icons-react'
import { IconButton } from './ui/IconButton'
import { Button } from './ui/Button'
import { PersonChipInput } from './ui/PersonChipInput'
import type { Person } from '@/data/peopleData'

export interface StartTopicResult {
  title: string
  invitees: Person[]
}

interface CreateTopicDialogProps {
  defaultTitle?: string
  defaultInvitees?: Person[]
  /** When set, the dialog renders the DM-to-huddle privacy banner. */
  dmContext?: { participants: Person[] }
  /** Label for the confirm button. Defaults to "Start topic". */
  confirmLabel?: string
  onConfirm: (data: StartTopicResult) => void
  onCancel: () => void
}

export function CreateTopicDialog({
  defaultTitle = '',
  defaultInvitees = [],
  dmContext,
  confirmLabel = 'Start topic',
  onConfirm,
  onCancel,
}: CreateTopicDialogProps) {
  const [title, setTitle] = useState(defaultTitle)
  const [invitees, setInvitees] = useState<Person[]>(defaultInvitees)

  const canConfirm = title.trim().length > 0

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onCancel} />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="w-[502px] bg-bg-elevated border border-border-subtle rounded-lg shadow-lg pointer-events-auto flex flex-col overflow-hidden">

          {/* Header */}
          <div className="h-12 flex items-center justify-between pl-5 pr-4 border-b border-border-subtle shrink-0">
            <span className="text-h4 text-text-primary">Start topic</span>
            <IconButton tooltip="Close" aria-label="Close" onClick={onCancel}>
              <IconX size={16} stroke={1.5} />
            </IconButton>
          </div>

          {/* Content */}
          <div className="pl-5 pr-4 py-4 flex flex-col gap-6 border-b border-border-subtle overflow-y-auto">

            {/* Title */}
            <div className="flex flex-col gap-2">
              <label className="text-input-label text-text-primary flex items-center">
                Title
                <span className="text-error-default ml-0.5">*</span>
              </label>
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's this topic about?"
                className="bg-bg-inset border border-border-default focus:border-border-strong rounded-lg px-3 py-2 text-body-2 text-text-primary placeholder:text-text-muted outline-none transition-colors"
              />
            </div>

            {/* Invite people */}
            <div className="flex flex-col gap-2">
              <label className="text-input-label text-text-primary">
                Invite people
              </label>
              <PersonChipInput
                value={invitees}
                onChange={setInvitees}
                placeholder="Search people..."
              />
            </div>

            {/* DM-to-huddle privacy banner */}
            {dmContext && (
              <div className="flex items-start gap-2 border border-warning-default rounded-lg px-3 py-2.5">
                <IconLock size={16} stroke={1.5} className="text-text-primary shrink-0 mt-0.5" />
                <p className="text-body-2 text-text-primary leading-[1.4]">
                  This DM becomes a private huddle inside the new topic. Only you and the other DM participants can see it — the topic itself is public.
                </p>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="h-12 flex items-center justify-end gap-2 pl-5 pr-4 shrink-0">
            <Button variant="muted" onClick={onCancel}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!canConfirm}
              onClick={() => canConfirm && onConfirm({ title, invitees })}
            >
              {confirmLabel}
            </Button>
          </div>

        </div>
      </div>
    </>,
    document.body
  )
}
