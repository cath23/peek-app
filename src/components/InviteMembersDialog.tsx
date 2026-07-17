import { useState } from 'react'
import { createPortal } from 'react-dom'
import { IconX } from '@tabler/icons-react'
import { IconButton } from './ui/IconButton'
import { Button } from './ui/Button'
import { PersonChipInput } from './ui/PersonChipInput'
import { usePeople, type Person } from '@/api'

interface InviteMembersDialogProps {
  /** Display names already in the topic — excluded from the suggestions. */
  memberNames?: string[]
  onConfirm: (invitees: Person[]) => void
  onCancel: () => void
}

/** The empty-topic banner's "Invite members" flow: pick people, add them to
 *  the topic's membership. Visual shell mirrors StartHuddleDialog. */
export function InviteMembersDialog({ memberNames = [], onConfirm, onCancel }: InviteMembersDialogProps) {
  const [invitees, setInvitees] = useState<Person[]>([])
  const people = usePeople() ?? []
  const memberIds = people.filter((p) => memberNames.includes(p.name)).map((p) => p.id)

  const canConfirm = invitees.length > 0

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onCancel} />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="w-[502px] bg-bg-elevated border border-border-subtle rounded-lg shadow-lg pointer-events-auto flex flex-col overflow-hidden">

          {/* Header */}
          <div className="h-12 flex items-center justify-between pl-5 pr-4 border-b border-border-subtle shrink-0">
            <span className="text-h4 text-text-primary">Invite members</span>
            <IconButton tooltip="Close" aria-label="Close" onClick={onCancel}>
              <IconX size={16} stroke={1.5} />
            </IconButton>
          </div>

          {/* Content */}
          <div className="pl-5 pr-4 py-4 flex flex-col gap-6 border-b border-border-subtle overflow-y-auto">
            <div className="flex flex-col gap-2">
              <label className="text-input-label text-text-primary flex items-center">
                Invite people
                <span className="text-error-default ml-0.5">*</span>
              </label>
              <PersonChipInput
                value={invitees}
                onChange={setInvitees}
                placeholder="Search people..."
                excludeIds={memberIds}
                autoFocus
              />
            </div>
          </div>

          {/* Footer */}
          <div className="h-12 flex items-center justify-end gap-2 pl-5 pr-4 shrink-0">
            <Button variant="muted" onClick={onCancel}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!canConfirm}
              onClick={() => canConfirm && onConfirm(invitees)}
            >
              Invite
            </Button>
          </div>

        </div>
      </div>
    </>,
    document.body
  )
}
