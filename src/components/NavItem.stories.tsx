import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { IconNote, IconMessage2, IconUsers } from '@tabler/icons-react'
import { NavItem } from './NavItem'

const meta = {
  title: 'Navigation/NavItem',
  component: NavItem,
  decorators: [
    Story => (
      // Current location is /desk, so a NavItem to="/desk" reads as active.
      <MemoryRouter initialEntries={['/desk']}>
        <div className="w-16 bg-bg-base py-2">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  args: {
    to: '/desk',
    icon: <IconNote size={16} stroke={1.5} />,
    label: 'Desk',
  },
  argTypes: {
    icon: { control: false },
  },
} satisfies Meta<typeof NavItem>

export default meta
type Story = StoryObj<typeof meta>

/** Active — its route matches the current location: filled background, primary text + label. */
export const Active: Story = {}

/** Inactive — muted icon + label, background appears only on hover. */
export const Inactive: Story = {
  args: { to: '/topics', icon: <IconMessage2 size={16} stroke={1.5} />, label: 'Topics' },
}

/** The three rail destinations stacked (Desk active). */
export const AllItems: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <NavItem to="/desk" icon={<IconNote size={16} stroke={1.5} />} label="Desk" />
      <NavItem to="/topics" icon={<IconMessage2 size={16} stroke={1.5} />} label="Topics" />
      <NavItem to="/people" icon={<IconUsers size={16} stroke={1.5} />} label="People" />
    </div>
  ),
}
