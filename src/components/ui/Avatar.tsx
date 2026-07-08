import { cn } from '@/lib/utils'
import { avatarFor } from '@/api'

interface AvatarProps {
  src?: string
  /** When src is not provided, resolves the avatar by author name from PEOPLE. */
  name?: string
  alt?: string
  size?: number
  className?: string
}

export function Avatar({ src, name, alt = '', size = 36, className }: AvatarProps) {
  const resolved = src ?? avatarFor(name) ?? avatarFor(alt)
  return (
    <div
      className={cn('rounded-sm overflow-hidden shrink-0 bg-bg-inset', className)}
      style={{ width: size, height: size }}
    >
      {resolved ? (
        <img src={resolved} alt={alt || name || ''} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-accent-muted" />
      )}
    </div>
  )
}
