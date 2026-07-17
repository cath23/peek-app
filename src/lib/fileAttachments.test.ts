import { describe, it, expect } from 'vitest'
import {
  validateFile,
  fileExtension,
  isImageAttachment,
  formatBytes,
  fileTypeLabel,
  FILE_MAX_BYTES,
} from './fileAttachments'

/** Minimal File stand-in — jsdom's File works, but this keeps the size exact. */
function fakeFile(name: string, size = 1024, type = ''): File {
  return { name, size, type } as File
}

describe('fileAttachments', () => {
  it('extracts the lowercased extension', () => {
    expect(fileExtension('Report.PDF')).toBe('pdf')
    expect(fileExtension('archive.tar.gz')).toBe('gz')
    expect(fileExtension('README')).toBe('')
  })

  it('accepts the allowlisted types incl. md/json/zip', () => {
    for (const n of ['a.png', 'b.pdf', 'c.md', 'd.json', 'e.zip', 'f.docx', 'g.csv']) {
      expect(validateFile(fakeFile(n))).toBeNull()
    }
  })

  it('rejects executables even though they are not on the allowlist path', () => {
    expect(validateFile(fakeFile('virus.exe'))).toMatch(/executable/)
    expect(validateFile(fakeFile('script.sh'))).toMatch(/executable/)
  })

  it('rejects unsupported types', () => {
    expect(validateFile(fakeFile('movie.mkv'))).toMatch(/aren't supported/)
  })

  it('rejects oversized files', () => {
    expect(validateFile(fakeFile('big.zip', FILE_MAX_BYTES + 1))).toMatch(/larger than/)
  })

  it('detects images by extension or content type', () => {
    expect(isImageAttachment('photo.jpg')).toBe(true)
    expect(isImageAttachment('x', 'image/png')).toBe(true)
    expect(isImageAttachment('doc.pdf')).toBe(false)
  })

  it('formats sizes', () => {
    expect(formatBytes(500)).toBe('500 bytes')
    expect(formatBytes(2048)).toBe('2 KB')
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB')
  })

  it('labels the chip by type', () => {
    expect(fileTypeLabel('a.pdf')).toBe('PDF')
    expect(fileTypeLabel('README')).toBe('FILE')
  })
})
