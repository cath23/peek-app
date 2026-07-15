import { IconUserFilled } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useAvatarSrc } from '@/api'

interface AvatarProps {
  src?: string
  /** When src is not provided, resolves the avatar by author name from PEOPLE. */
  name?: string
  alt?: string
  size?: number
  className?: string
}

export function Avatar({ src, name, alt = '', size = 36, className }: AvatarProps) {
  // Uploaded avatar > seeded demo portrait > silhouette. Outside a
  // PeekDataProvider (Storybook, tests) this falls back to the mock portraits.
  const avatarSrcFor = useAvatarSrc()
  const resolved = src ?? avatarSrcFor(name) ?? avatarSrcFor(alt)
  return (
    <div
      className={cn('rounded-sm overflow-hidden shrink-0 bg-bg-inset', className)}
      style={{ width: size, height: size }}
    >
      {resolved ? (
        <img src={resolved} alt={alt || name || ''} className="w-full h-full object-cover" />
      ) : (
        // No portrait (e.g. a signed-up user before uploading one): a small
        // FILLED person glyph on the accent-muted tint (user decision 2026-07-15).
        <div className="w-full h-full bg-accent-muted flex items-center justify-center text-text-muted">
          <IconUserFilled size={Math.round(size * 0.5)} />
        </div>
      )}
    </div>
  )
}
