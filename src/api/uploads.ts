/**
 * File-upload writes — the composer's attach flow (Phase 5).
 *
 * Mirrors the avatar upload (profile.ts): ask Convex for a short-lived upload
 * URL, POST the blob, keep the returned storage id. The id + metadata then
 * ride into `messages.send`/`replies.send` as `fileAttachments`. Uploads need
 * real storage, so this is Convex-only (no-op path throws in mock mode — the
 * composer hides the attach button when `!hasConvex`, per the rule that an
 * action only appears where it can succeed).
 */
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { hasConvex } from './store'
import { validateFile, isImageAttachment } from '@/lib/fileAttachments'

/** An uploaded file, ready to attach to a message/reply. `previewUrl` is a
 *  local object URL for the optimistic window (images render before the
 *  server resolves the real storage URL). */
export interface UploadedFile {
  storageId: string
  name: string
  contentType: string
  size: number
  previewUrl?: string
}

export function useUploadActions() {
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl)
  const deleteUploadRemote = useMutation(api.messages.deleteUpload)

  return {
    /** Clean up a blob that was uploaded but removed before sending. */
    deleteUpload(storageId: string) {
      if (hasConvex) void deleteUploadRemote({ storageId: storageId as never })
    },

    /** Upload one file and return its descriptor. Throws with a user-facing
     *  message on a rejected type/size or a failed request. */
    async uploadFile(file: File): Promise<UploadedFile> {
      const err = validateFile(file)
      if (err) throw new Error(err)
      if (!hasConvex) throw new Error('File uploads need the live app.')
      const uploadUrl = await generateUploadUrl({})
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })
      if (!res.ok) throw new Error('Upload failed — please try again.')
      const { storageId } = (await res.json()) as { storageId: string }
      return {
        storageId,
        name: file.name,
        contentType: file.type || '',
        size: file.size,
        previewUrl: isImageAttachment(file.name, file.type) ? URL.createObjectURL(file) : undefined,
      }
    },
  }
}
