import { Avatar } from './Avatar'

/** Up to 3 overlapping 24px avatars with a border-bg-surface outline — the member
 *  stack used in the ConversationHeader members pill. Matches the Figma members component. */
export function AvatarGroup({ members }: { members: string[] }) {
  const visible = members.slice(0, 3)
  return (
    <div className="flex items-center pr-2">
      {visible.map((name, i) => (
        <div
          key={i}
          className="-mr-2 relative shrink-0 size-6 rounded-sm overflow-hidden border-2 border-bg-surface"
        >
          <Avatar size={24} name={name} alt={name} />
        </div>
      ))}
    </div>
  )
}
