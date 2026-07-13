import { useRef, useState } from 'react'
import { IconUpload, IconTrash } from '@tabler/icons-react'
import { useCurrentUser, useProfileActions, CURRENT_USER_NAME } from '@/api'
import { Avatar } from './ui/Avatar'
import { Button } from './ui/Button'
import { DialogShell } from './ui/DialogShell'
import { Field } from './ui/Field'
import { TextInput } from './ui/TextInput'

/**
 * Edit your own profile (Phase 3): display name, role, and avatar.
 * The avatar uploads immediately (it's a file, not form state); name and
 * role save on confirm. Email is your sign-in identity and isn't editable.
 */
export function ProfileDialog({ onClose }: { onClose: () => void }) {
  const me = useCurrentUser()
  const actions = useProfileActions()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(me?.name ?? '')
  const [role, setRole] = useState(me?.role ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const canSave = name.trim().length > 0 && !busy

  const run = async (fn: () => Promise<void>) => {
    setError(null)
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong — please try again.')
    } finally {
      setBusy(false)
    }
  }

  const pickFile = (file: File | undefined) => {
    if (!file) return
    void run(() => actions.uploadAvatar(file))
  }

  const save = () => {
    if (!canSave) return
    void run(async () => {
      await actions.updateProfile(name, role)
      onClose()
    })
  }

  return (
    <DialogShell
      title="Profile"
      onClose={onClose}
      bodyClassName="flex flex-col gap-6"
      footer={
        <>
          <Button variant="muted" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!canSave} onClick={save}>Save</Button>
        </>
      }
    >
      {/* Avatar — uploads on pick, no separate save */}
      <div className="flex items-center gap-4">
        <Avatar size={64} src={me?.avatarUrl} name={CURRENT_USER_NAME} alt="Your avatar" />
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              size="small"
              disabled={busy}
              leadingIcon={<IconUpload size={14} stroke={1.5} />}
              onClick={() => fileRef.current?.click()}
            >
              Upload photo
            </Button>
            {me?.avatarUrl && (
              <Button
                variant="muted"
                size="small"
                disabled={busy}
                leadingIcon={<IconTrash size={14} stroke={1.5} />}
                onClick={() => void run(() => actions.removeAvatar())}
              >
                Remove
              </Button>
            )}
          </div>
          <span className="text-input-helper text-text-muted">JPG, PNG or GIF — up to 5 MB.</span>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            pickFile(e.target.files?.[0])
            e.target.value = '' // let the same file be picked again
          }}
        />
      </div>

      <Field label="Full name" required>
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ada Lovelace"
        />
      </Field>

      <Field label="Role">
        <TextInput
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Product Designer"
        />
      </Field>

      {me?.email && (
        <div className="flex flex-col gap-2">
          <span className="text-input-label text-text-primary">Email</span>
          <span className="text-body-2 text-text-secondary">{me.email}</span>
          <span className="text-input-helper text-text-muted">You sign in with this address.</span>
        </div>
      )}

      {error && <p className="text-caption text-error-default">{error}</p>}
    </DialogShell>
  )
}
