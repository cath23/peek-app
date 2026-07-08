import { type ReactNode } from 'react'

interface FieldProps {
  /** Field label rendered above the control. */
  label: string
  /** Show a red required asterisk after the label. */
  required?: boolean
  /** The control — TextInput, Textarea, PersonChipInput, etc. */
  children: ReactNode
}

/**
 * A labelled form row: label (with optional required `*`) above its control,
 * `gap-2` between them. The label className is a plain string — NOT run through
 * tw-merge — so `text-input-label` isn't dropped next to `text-text-primary`
 * (see CLAUDE.md pitfall).
 */
export function Field({ label, required = false, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className={`text-input-label text-text-primary${required ? ' flex items-center' : ''}`}>
        {label}
        {required && <span className="text-error-default ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
