import { useState } from 'react'
import { Button } from './ui/Button'
import { DialogShell } from './ui/DialogShell'
import { Field } from './ui/Field'
import { Textarea } from './ui/Textarea'

interface ResolveDialogProps {
  onResolve: (message: string) => void
  onCancel: () => void
}

export function ResolveDialog({ onResolve, onCancel }: ResolveDialogProps) {
  const [message, setMessage] = useState('')

  return (
    <DialogShell
      title="Resolve"
      onClose={onCancel}
      footer={
        <>
          <Button variant="muted" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={() => onResolve(message)}>Resolve</Button>
        </>
      }
    >
      <Field label="Resolution message (optional)">
        <Textarea
          autoFocus
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Summarize the outcome or decision..."
          className="h-[109px]"
        />
      </Field>
    </DialogShell>
  )
}
