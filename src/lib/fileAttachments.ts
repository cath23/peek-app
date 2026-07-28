/**
 * Upload policy + presentation helpers for real file attachments (Phase 5).
 *
 * The gate is by file EXTENSION, not MIME: browsers report `File.type` as ''
 * or an inconsistent value for `.md`, `.json`, `.zip`, so extension is the
 * only reliable signal. A hard executable blocklist wins over everything —
 * even if the allowlist broadens later, those never get through.
 */

/** 25 MB — 5× the avatar limit; documents/zips are legitimately larger. */
export const FILE_MAX_BYTES = 25 * 1024 * 1024

/** 100 MB for video only — a 30s screen recording is 10–40 MB, so the
 *  general cap would reject the most common video use case (ruling
 *  2026-07-28). */
export const VIDEO_MAX_BYTES = 100 * 1024 * 1024

/** Extensions we accept (see the product ruling 2026-07-17; video added
 *  2026-07-28 — browser-decodable containers only, no avi/mkv/wmv). */
export const ALLOWED_EXTENSIONS = [
  // images
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'heif', 'svg',
  // video — mov is accepted because every iPhone clip and macOS screen
  // recording is one; the rare HEVC-inside-mov that a browser can't decode
  // falls back to a download row in the card, never a rejection here.
  'mp4', 'm4v', 'webm', 'mov',
  // documents
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'txt', 'md', 'rtf',
  // data / archive
  'json', 'zip',
] as const

/** Always rejected, regardless of the allowlist — executables / scripts. */
export const BLOCKED_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'com', 'msi', 'sh', 'app', 'scr', 'jar', 'ps1', 'vbs', 'dll',
] as const

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'heif', 'svg'])
const VIDEO_EXTENSIONS = new Set(['mp4', 'm4v', 'webm', 'mov'])

/** Lowercased extension without the dot (''/no-dot filenames → ''). */
export function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : ''
}

export function isImageAttachment(name: string, contentType?: string): boolean {
  return IMAGE_EXTENSIONS.has(fileExtension(name)) || (contentType?.startsWith('image/') ?? false)
}

export function isVideoAttachment(name: string, contentType?: string): boolean {
  return VIDEO_EXTENSIONS.has(fileExtension(name)) || (contentType?.startsWith('video/') ?? false)
}

/** `'2.4 MB'`, `'812 KB'`, `'340 bytes'`. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

/** A short type label for the chip (`'PDF'`, `'ZIP'`, `'DOCX'`, `'FILE'`). */
export function fileTypeLabel(name: string): string {
  const ext = fileExtension(name)
  return ext ? ext.toUpperCase() : 'FILE'
}

/**
 * Client-side validation. Returns an error message to surface, or null when
 * the file is acceptable. The server trusts the client here (uploads are
 * viewer-gated) — this is UX, not a security boundary.
 */
export function validateFile(file: File): string | null {
  const ext = fileExtension(file.name)
  if ((BLOCKED_EXTENSIONS as readonly string[]).includes(ext)) {
    return `${file.name} is an executable and can't be attached.`
  }
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return `${fileTypeLabel(file.name)} files aren't supported.`
  }
  const maxBytes = isVideoAttachment(file.name, file.type) ? VIDEO_MAX_BYTES : FILE_MAX_BYTES
  if (file.size > maxBytes) {
    return `${file.name} is larger than ${formatBytes(maxBytes)}.`
  }
  return null
}

/** `accept` attribute for the <input type=file> (dot-prefixed extensions). */
export const FILE_ACCEPT_ATTR = ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',')
