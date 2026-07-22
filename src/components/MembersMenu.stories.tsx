import type { Meta, StoryObj } from '@storybook/react-vite'
import { MembersMenu } from './MembersMenu'

const meta = {
  title: 'Messages/Menus/MembersMenu',
  component: MembersMenu,
  args: {
    members: ['You', 'Alice Johnson', 'Jake Walter', 'Zack Bright', 'Amie Miles'],
  },
  argTypes: {
    members: { control: false },
  },
} satisfies Meta<typeof MembersMenu>

export default meta
type Story = StoryObj<typeof meta>

/** As a topic member: full list with the "Add members" row on top. */
export const Member: Story = {
  args: { onAddMembers: () => {} },
}

/** As a non-member: read-only list — the add affordance lives behind the
 *  Join banner instead (capability rule). */
export const NonMember: Story = {}

/** Long rosters scroll inside the popover. */
export const Scrolling: Story = {
  args: {
    onAddMembers: () => {},
    members: [
      'You', 'Alice Johnson', 'Jake Walter', 'Zack Bright', 'Amie Miles',
      'Daniel Stanton', 'Greg Bothman', 'Juan Foley', 'Hallie Pratt',
      'Bessie Cooper', 'Jenny Wilson', 'Guy Hawkins',
    ],
  },
}
