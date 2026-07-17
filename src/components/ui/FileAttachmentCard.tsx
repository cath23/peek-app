import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  IconFile,
  IconFileTypePdf,
  IconFileTypeDocx,
  IconFileTypeXls,
  IconFileTypePpt,
  IconFileTypeCsv,
  IconFileTypeZip,
  IconFileTypeTxt,
  IconJson,
  IconMarkdown,
  IconX,
} from '@tabler/icons-react'
import { fileExtension, isImageAttachment, formatBytes, fileTypeLabel } from '@/lib/fileAttachments'
import type { FileAttachment } from '@/api'
import { cn } from '@/lib/utils'

const ICON_BY_EXT: Record<string, React.FC<{ size?: number; stroke?: number; className?: string }>> = {
  pdf: IconFileTypePdf,
  doc: IconFileTypeDocx,
  docx: IconFileTypeDocx,
  xls: IconFileTypeXls,
  xlsx: IconFileTypeXls,
  ppt: IconFileTypePpt,
  pptx: IconFileTypePpt,
  csv: IconFileTypeCsv,
  txt: IconFileTypeTxt,
  rtf: IconFileTypeTxt,
  zip: IconFileTypeZip,
  json: IconJson,
  md: IconMarkdown,
}

function FileIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_BY_EXT[fileExtension(name)] ?? IconFile
  return <Icon size={20} stroke={1.5} className={className} />
}

/** A simple full-screen viewer for uploaded images (mirrors FrameLightbox). */
function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-8" onClick={onClose}>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        aria-label="Close"
        className="absolute top-4 right-4 size-8 rounded-full bg-bg-elevated border border-border-strong flex items-center justify-center text-text-secondary hover:text-text-primary"
        onClick={onClose}
      >
        <IconX size={16} stroke={1.5} />
      </button>
    </div>,
    document.body,
  )
}

interface FileAttachmentCardProps {
  file: FileAttachment
  className?: string
}

/**
 * A rendered file attachment on a message/reply card. Images show a thumbnail
 * and open in a lightbox; other types show a type icon + name + size and open
 * in a new tab (download). `url` is the resolved storage URL; during the
 * optimistic window only `previewUrl` (a local object URL) may exist.
 */
export function FileAttachmentCard({ file, className }: FileAttachmentCardProps) {
  const [lightbox, setLightbox] = useState(false)
  const href = file.url ?? file.previewUrl
  const isImage = isImageAttachment(file.name, file.contentType)

  if (isImage && href) {
    return (
      <>
        <button
          type="button"
          data-interactive
          className={cn(
            'group relative block w-[180px] rounded-lg border border-border-subtle overflow-hidden bg-bg-inset hover:border-border-default transition-colors',
            className,
          )}
          onClick={(e) => {
            e.stopPropagation()
            setLightbox(true)
          }}
        >
          <img src={href} alt={file.name} className="w-full h-28 object-cover" />
          <div className="flex items-center gap-1.5 px-2 py-1.5 min-w-0">
            <span className="text-[12px] leading-[1.3] text-text-primary truncate">{file.name}</span>
          </div>
        </button>
        {lightbox && <ImageLightbox src={href} alt={file.name} onClose={() => setLightbox(false)} />}
      </>
    )
  }

  // Non-image (or image without a URL yet): a compact file row.
  const body = (
    <>
      <div className="size-9 rounded-md bg-bg-active flex items-center justify-center shrink-0 text-text-secondary">
        <FileIcon name={file.name} />
      </div>
      <div className="flex flex-col gap-[1px] min-w-0">
        <span className="text-[12px] font-medium leading-[1.3] text-text-primary truncate">{file.name}</span>
        <span className="text-[10px] leading-[1.2] text-text-secondary truncate">
          {fileTypeLabel(file.name)} · {formatBytes(file.size)}
        </span>
      </div>
    </>
  )

  const shell = cn(
    'flex items-center gap-2 w-[220px] rounded-lg border border-border-subtle bg-bg-inset p-1.5 pr-3 transition-colors',
    href ? 'hover:border-border-default cursor-pointer' : 'opacity-70',
    className,
  )

  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-interactive
      className={shell}
      onClick={(e) => e.stopPropagation()}
    >
      {body}
    </a>
  ) : (
    <div className={shell}>{body}</div>
  )
}
