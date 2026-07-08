import { useState } from 'react'
import { createPortal } from 'react-dom'
import { IconX } from '@tabler/icons-react'
import { IconButton } from './ui/IconButton'
import { Button } from './ui/Button'
import { PersonChipInput } from './ui/PersonChipInput'
import { AGENTS, type Agent } from '@/data/agentData'
import type { Person } from '@/data/peopleData'

export interface NewAgentDmResult {
  agents: Agent[]
}

interface NewAgentDmDialogProps {
  onConfirm: (data: NewAgentDmResult) => void
  onCancel: () => void
}

/**
 * Entry point for starting a conversation with one or more agents.
 * One agent selected -> opens that agent's DM. Several -> a group
 * conversation with all of them. Same dialog shell as StartHuddleDialog.
 */
export function NewAgentDmDialog({ onConfirm, onCancel }: NewAgentDmDialogProps) {
  const [selected, setSelected] = useState<Person[]>([])

  const canConfirm = selected.length > 0

  const handleConfirm = () => {
    if (!canConfirm) return
    const ids = new Set(selected.map((p) => p.id))
    onConfirm({ agents: AGENTS.filter((a) => ids.has(a.id)) })
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onCancel} />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="w-[502px] bg-bg-elevated border border-border-subtle rounded-lg shadow-lg pointer-events-auto flex flex-col overflow-hidden">

          {/* Header */}
          <div className="h-12 flex items-center justify-between pl-5 pr-4 border-b border-border-subtle shrink-0">
            <span className="text-h4 text-text-primary">New agent conversation</span>
            <IconButton tooltip="Close" aria-label="Close" onClick={onCancel}>
              <IconX size={16} stroke={1.5} />
            </IconButton>
          </div>

          {/* Content */}
          <div className="pl-5 pr-4 py-4 flex flex-col gap-2 border-b border-border-subtle overflow-y-auto">
            <label className="text-input-label text-text-primary flex items-center">
              Agents
              <span className="text-error-default ml-0.5">*</span>
            </label>
            <PersonChipInput
              value={selected}
              onChange={setSelected}
              people={AGENTS}
              placeholder="Search agents..."
              autoFocus
            />
            <p className="text-caption text-text-secondary">
              Pick one agent to message it directly, or several for a group conversation.
            </p>
          </div>

          {/* Footer */}
          <div className="h-12 flex items-center justify-end gap-2 pl-5 pr-4 shrink-0">
            <Button variant="muted" onClick={onCancel}>Cancel</Button>
            <Button variant="primary" disabled={!canConfirm} onClick={handleConfirm}>
              Start conversation
            </Button>
          </div>

        </div>
      </div>
    </>,
    document.body
  )
}
