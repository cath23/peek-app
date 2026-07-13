/**
 * Profile writes — the viewer's own name, role, and avatar.
 *
 * The avatar is a real file upload: ask Convex for a short-lived upload
 * URL, POST the file to it, then attach the returned storage id. Mock mode
 * (no deployment) has no identity server, so these are no-ops.
 */
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { hasConvex } from './store'

/** Images only, and small enough to keep the free storage tier happy. */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024

export function useProfileActions() {
  const updateProfileRemote = useMutation(api.users.updateProfile)
  const generateUploadUrl = useMutation(api.users.generateAvatarUploadUrl)
  const setAvatarRemote = useMutation(api.users.setAvatar)
  const removeAvatarRemote = useMutation(api.users.removeAvatar)

  return {
    async updateProfile(name: string, role: string) {
      if (!hasConvex) return
      await updateProfileRemote({ name, role })
    },

    /** Upload an image and make it the viewer's avatar. Throws on a bad file. */
    async uploadAvatar(file: File) {
      if (!hasConvex) return
      if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.')
      if (file.size > AVATAR_MAX_BYTES) throw new Error('That image is larger than 5 MB.')
      const uploadUrl = await generateUploadUrl({})
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!res.ok) throw new Error('Upload failed — please try again.')
      const { storageId } = (await res.json()) as { storageId: string }
      await setAvatarRemote({ storageId: storageId as never })
    },

    async removeAvatar() {
      if (!hasConvex) return
      await removeAvatarRemote({})
    },
  }
}
