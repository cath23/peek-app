import { IconUserPlus } from '@tabler/icons-react'
import { Avatar } from './ui/Avatar'

interface MembersMenuProps {
  /** Display names, as shown in the members pill (the viewer may be 'You'). */
  members: string[]
  /** Present only when the viewer can invite (they are a member themselves) —
   *  the row is hidden otherwise, per the capability rule. */
  onAddMembers?: () => void
}

/**
 * The members pill's popover (Slack's channel-members panel, scaled down):
 * every member with their avatar, and — for members — an "Add members" row on
 * top that opens the InviteMembersDialog. Open/close behavior (outside click,
 * Escape, mouse leave) is owned by the anchor in ConversationHeader.
 */
export function MembersMenu({ members, onAddMembers }: MembersMenuProps) {
  return (
    <div
      data-interactive
      className="w-[240px] bg-bg-elevated border border-border-default rounded-lg shadow-lg p-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center h-8 px-2">
        <span className="text-h5 text-text-secondary">Members · {members.length}</span>
      </div>

      {onAddMembers && (
        <div
          role="button"
          className="flex items-center gap-2 px-2 h-[32px] rounded-lg cursor-pointer hover:bg-bg-hover transition-colors"
          onClick={onAddMembers}
        >
          <div className="size-6 rounded-sm bg-accent-muted flex items-center justify-center shrink-0 text-accent-primary">
            <IconUserPlus size={14} stroke={1.5} />
          </div>
          <span className="flex-1 text-sm text-text-primary truncate">Add members</span>
        </div>
      )}

      <div className="max-h-[280px] overflow-y-auto">
        {members.map((name) => (
          <div key={name} className="flex items-center gap-2 px-2 h-[32px] rounded-lg">
            <div className="size-6 rounded-sm overflow-hidden shrink-0">
              <Avatar size={24} name={name} alt={name} />
            </div>
            <span className="flex-1 text-sm text-text-secondary truncate">{name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
