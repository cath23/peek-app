import type { Meta, StoryObj } from '@storybook/react-vite'
import { AvatarGroup } from './AvatarGroup'

const meta = {
  title: 'Primitives/AvatarGroup',
  component: AvatarGroup,
  args: {
    members: ['Alice Johnson', 'Amie Miles', 'Daniel Stanton'],
  },
  argTypes: {
    members: { control: false },
  },
} satisfies Meta<typeof AvatarGroup>

export default meta
type Story = StoryObj<typeof meta>

/** Overlapping member avatars — caps at 3 visible. */
export const Default: Story = {}

export const Two: Story = {
  args: { members: ['Alice Johnson', 'Amie Miles'] },
}

export const One: Story = {
  args: { members: ['Amie Miles'] },
}

/** More than 3 members still shows only 3 avatars (the count lives in the pill). */
export const Overflow: Story = {
  args: { members: ['Alice Johnson', 'Amie Miles', 'Daniel Stanton', 'Greg Bothman', 'Zack Bright'] },
}

/**
 * As it appears in the ConversationHeader: the group inside a pill with the total count —
 * the "2" / "4" badge from the topic and DM headers.
 */
export const InMembersPill: Story = {
  render: args => (
    <div className="bg-bg-elevated border border-border-default rounded-sm flex gap-2 items-center pl-[2px] pr-2 py-[2px] w-fit">
      <AvatarGroup {...args} />
      <span className="text-caption text-text-secondary">{args.members.length}</span>
    </div>
  ),
}
